-- Round two: every record belongs to a business, and a business only ever
-- sees its own. Separation is enforced by Postgres (Row Level Security and
-- column privileges), not by the app, so a bug in the app or a hand-crafted
-- API call still can't cross from one business into another.

create table public.businesses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (btrim(name) <> '' and char_length(name) <= 80),
  created_at timestamptz not null default now()
);

comment on table public.businesses is 'One row per business. Every transaction belongs to one.';

-- Who belongs to which business. Today a login owns exactly one business;
-- staff logins can join later without changing any policy below.
create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner')),
  created_at  timestamptz not null default now(),
  primary key (business_id, user_id)
);

create unique index business_members_one_business_per_user on public.business_members (user_id);

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

create policy "Read own membership" on public.business_members
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Read own business" on public.businesses
  for select to authenticated
  using (id in (select m.business_id from public.business_members m where m.user_id = (select auth.uid())));

-- Read-only from the app. Businesses and memberships are only ever created by
-- the sign-up trigger below, so nobody can add themselves to someone else's.
revoke all on table public.businesses, public.business_members from anon, authenticated;
grant select on table public.businesses, public.business_members to authenticated;
grant all on table public.businesses, public.business_members to service_role;

-- The signed-in user's business. Used as the default for new transactions.
create function public.current_business_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select m.business_id from public.business_members m where m.user_id = (select auth.uid());
$$;

revoke execute on function public.current_business_id() from public, anon;
grant execute on function public.current_business_id() to authenticated;


-- Every new login gets its own, empty business.
create function public.create_business_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business uuid;
begin
  insert into public.businesses (name)
  values (coalesce(left(nullif(btrim(new.raw_user_meta_data ->> 'business_name'), ''), 80), 'My business'))
  returning id into new_business;

  insert into public.business_members (business_id, user_id) values (new_business, new.id);
  return new;
end;
$$;

revoke execute on function public.create_business_for_new_user() from public, anon, authenticated;

create trigger create_business_for_new_user
  after insert on auth.users
  for each row execute function public.create_business_for_new_user();

-- Logins that already exist get a business too.
do $$
declare
  u record;
  new_business uuid;
begin
  for u in
    select id, raw_user_meta_data from auth.users
    where not exists (select 1 from public.business_members m where m.user_id = auth.users.id)
  loop
    insert into public.businesses (name)
    values (coalesce(left(nullif(btrim(u.raw_user_meta_data ->> 'business_name'), ''), 80), 'My business'))
    returning id into new_business;
    insert into public.business_members (business_id, user_id) values (new_business, u.id);
  end loop;
end;
$$;


-- Transactions now belong to a business. user_id stays as "who recorded it".
alter table public.transactions
  add column business_id uuid references public.businesses (id) on delete cascade;

update public.transactions t
set business_id = m.business_id
from public.business_members m
where m.user_id = t.user_id and t.business_id is null;

alter table public.transactions
  alter column business_id set not null,
  alter column business_id set default public.current_business_id(),
  add constraint amount_is_realistic check (amount <= 1000000);

drop index public.transactions_user_created_at_idx;
create index transactions_business_created_at_idx on public.transactions (business_id, created_at desc);

drop policy "Read own transactions" on public.transactions;
drop policy "Add own transactions" on public.transactions;
drop policy "Remove own transactions" on public.transactions;

create policy "Read own business transactions" on public.transactions
  for select to authenticated
  using (business_id in (select m.business_id from public.business_members m where m.user_id = (select auth.uid())));

create policy "Add to own business" on public.transactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and business_id in (select m.business_id from public.business_members m where m.user_id = (select auth.uid()))
  );

-- Undo only: the person who recorded an entry can remove it in the first
-- ten minutes. After that the record is permanent. There is still no update
-- policy, so entries are never edited.
create policy "Undo own recent entry" on public.transactions
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and created_at > now() - interval '10 minutes'
    and business_id in (select m.business_id from public.business_members m where m.user_id = (select auth.uid()))
  );

-- The app may only send what a person types. Owner, business and timestamp
-- are always set by the database, so they can't be forged.
revoke all on table public.transactions from anon, authenticated;
grant select, delete on table public.transactions to authenticated;
grant insert (id, type, amount, customer, job_name, description) on table public.transactions to authenticated;


-- The demo month now runs with the owner's rights (it back-dates entries,
-- which the app itself can't), so its own checks are the gate: demo account
-- only, current month only, empty month only.
create or replace function public.ensure_demo_month(month_start timestamptz, month_end timestamptz)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  business uuid := public.current_business_id();
  elapsed interval;
begin
  if uid is null or business is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'demo', '') <> 'true' then
    return false;
  end if;

  if not (month_start <= now() and now() < month_end and month_end - month_start <= interval '32 days') then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(business::text, 0));

  if exists (
    select 1 from public.transactions t
    where t.business_id = business and t.created_at >= month_start and t.created_at < month_end
  ) then
    return false;
  end if;

  elapsed := now() - month_start;

  insert into public.transactions (user_id, business_id, type, amount, customer, job_name, description, created_at)
  select uid, business, d.type, d.amount, d.customer, d.job_name, d.description, month_start + elapsed * d.at
  from (values
    ('expense'::text, 950.00::numeric, null::text, null::text, 'Workshop rent'::text, 0.02::float8),
    ('expense', 1129.00, null, null, 'Ute finance', 0.04),
    ('expense', 389.00, null, null, 'Public liability insurance', 0.08),
    ('income', 2450.00, 'Sarah Mitchell', 'Hot water system replacement', null, 0.12),
    ('expense', 1842.35, null, null, 'Plumbing supplies', 0.18),
    ('income', 380.00, 'Nguyen family', 'Blocked drain cleared', null, 0.26),
    ('expense', 540.00, null, null, 'Mini excavator hire', 0.33),
    ('income', 3200.00, 'George Papadopoulos', 'Bathroom rough-in', null, 0.41),
    ('expense', 1650.00, null, null, 'Tiler (subcontractor)', 0.49),
    ('income', 690.00, 'Harbourside Cafe', 'Grease trap service', null, 0.57),
    ('expense', 412.60, null, null, 'Fuel', 0.64),
    ('expense', 129.00, null, null, 'Phone and internet', 0.72),
    ('income', 240.00, 'Tom Wilson', 'Leaking tap and cistern repair', null, 0.80),
    ('expense', 383.45, null, null, 'Press fitting jaws', 0.88),
    ('income', 220.00, 'Priya Sharma', 'Gas heater service', null, 0.95)
  ) as d (type, amount, customer, job_name, description, at);

  return true;
end;
$$;

revoke execute on function public.ensure_demo_month(timestamptz, timestamptz) from public, anon;
grant execute on function public.ensure_demo_month(timestamptz, timestamptz) to authenticated;


-- The demo login is public, so nobody using it may take it over: its
-- password, email and phone can't be changed from the app. The seed script
-- resets the demo by recreating the account instead.
create function public.protect_demo_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(old.raw_app_meta_data ->> 'demo', '') = 'true' and (
    new.encrypted_password is distinct from old.encrypted_password
    or new.email is distinct from old.email
    or new.email_change is distinct from old.email_change
    or new.phone is distinct from old.phone
    or new.phone_change is distinct from old.phone_change
  ) then
    raise exception 'The demo account can''t be changed.';
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_demo_account() from public, anon, authenticated;

create trigger protect_demo_account
  before update on auth.users
  for each row execute function public.protect_demo_account();
