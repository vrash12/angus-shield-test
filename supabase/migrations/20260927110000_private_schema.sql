-- Code that runs with the owner's rights lives in a schema the API doesn't
-- expose. The app can only reach it through a thin public wrapper that runs
-- with the caller's own rights.

create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.ensure_demo_month(timestamptz, timestamptz) set schema private;

create function public.ensure_demo_month(month_start timestamptz, month_end timestamptz)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.ensure_demo_month(month_start, month_end);
$$;

revoke execute on function public.ensure_demo_month(timestamptz, timestamptz) from public, anon;
grant execute on function public.ensure_demo_month(timestamptz, timestamptz) to authenticated;

-- Sign-up and demo-protection triggers move too. Nobody calls them directly.
alter function public.create_business_for_new_user() set schema private;
alter function public.protect_demo_account() set schema private;
