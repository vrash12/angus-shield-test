-- Site VIP: one table for money in (finished jobs) and money out (expenses).
-- Every row belongs to one user, and Row Level Security keeps it that way.

create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  amount      numeric(12, 2) not null check (amount > 0),
  customer    text check (btrim(customer) <> '' and char_length(customer) <= 80),
  job_name    text check (btrim(job_name) <> '' and char_length(job_name) <= 120),
  description text check (btrim(description) <> '' and char_length(description) <= 120),
  created_at  timestamptz not null default now(),

  -- A finished job always says who it was for and what was done.
  constraint income_names_the_job check (type <> 'income' or (customer is not null and job_name is not null))
);

comment on table public.transactions is 'Money in (finished jobs) and money out (expenses), one row each.';

-- The dashboard asks for one user's month, newest first.
create index transactions_user_created_at_idx on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "Read own transactions" on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Add own transactions" on public.transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Only used by "Undo" straight after adding a job. There is no update policy:
-- entries are added or undone, never edited.
create policy "Remove own transactions" on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.transactions from anon, authenticated;
grant select, insert, delete on table public.transactions to authenticated;
grant all on table public.transactions to service_role;


-- Demo account only: fills the current month with realistic activity so a
-- reviewer always has a month to look at, whenever they open the app.
-- The app calls this when the demo user loads the dashboard. It does nothing
-- for real accounts, and nothing if the month already has entries.
-- The month starts slightly behind (-$245.40), so one finished job usually
-- tips it back into the black.
create function public.ensure_demo_month(month_start timestamptz, month_end timestamptz)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  elapsed interval;
begin
  if uid is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'demo', '') <> 'true' then
    return false;
  end if;

  -- Only the month that is happening now, as the user's browser sees it.
  if not (month_start <= now() and now() < month_end and month_end - month_start <= interval '32 days') then
    return false;
  end if;

  -- One seed per month, even if two tabs open at once.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  if exists (
    select 1 from public.transactions t
    where t.user_id = uid and t.created_at >= month_start and t.created_at < month_end
  ) then
    return false;
  end if;

  elapsed := now() - month_start;

  insert into public.transactions (user_id, type, amount, customer, job_name, description, created_at)
  select uid, d.type, d.amount, d.customer, d.job_name, d.description, month_start + elapsed * d.at
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
