-- =============================================================================
-- Cohorts: each intake's own dates, clock and holidays
-- =============================================================================
-- The programme was built for one intake: 2 to 30 November 2026, rounds at
-- 7, 8, 9 and 10am Kuala Lumpur time, Deepavali skipped. A firm runs more
-- than one intake, and a firm outside Kuala Lumpur runs on its own clock, so
-- each intake is now a cohort with its own first and last day, timezone,
-- round hours and the public holidays it does not run on.
--
-- A trainee belongs to at most one cohort (`profiles.cohort_id`). Their start
-- and end dates are still on their own profile, because homework, rounds and
-- the joining checklist all read them there: putting somebody in a cohort
-- copies its dates on, and changing a cohort's dates moves its people with
-- it. Anybody in no cohort keeps the programme as it was.
--
-- Written by the server only, after the app has checked the caller is an
-- administrator or the firm's administrator. Everybody signed in may read a
-- cohort: a trainee's pages need their own, and nothing in one is private.
-- =============================================================================

create table if not exists public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 80),
  starts_on   date not null,
  ends_on     date not null,
  timezone    text not null check (char_length(timezone) between 3 and 60),
  round_hours smallint[] not null,
  holidays    jsonb not null default '[]'::jsonb,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint cohorts_dates_in_order check (ends_on >= starts_on),
  constraint cohorts_round_hours_sane check (
    cardinality(round_hours) between 1 and 8
    and 5 <= all (round_hours)
    and 20 >= all (round_hours)
  ),
  constraint cohorts_holidays_list check (jsonb_typeof(holidays) = 'array')
);

comment on table public.cohorts is
  'An intake: its first and last day, the timezone its rounds run on, the '
  'hours they open at and the public holidays it skips. Server-written.';

create or replace trigger cohorts_touch before update on public.cohorts
  for each row execute function public.touch_updated_at();

alter table public.cohorts enable row level security;

drop policy if exists cohorts_read on public.cohorts;
create policy cohorts_read on public.cohorts
  for select to authenticated using (true);

revoke insert, update, delete, truncate on public.cohorts from anon, authenticated;

alter table public.profiles
  add column if not exists cohort_id uuid references public.cohorts (id) on delete set null;

comment on column public.profiles.cohort_id is
  'The intake this person is in. Set by the server for an administrator or '
  'the firm''s administrator, never by the person.';

-- The privilege guard, redefined whole from its 0037 body with the cohort
-- added: which intake somebody is in decides when their mornings are, so it
-- is the firm's decision, not theirs.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach
      or new.is_firm_admin is distinct from old.is_firm_admin)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin, is_coach and is_firm_admin may only be changed by an administrator';
  end if;

  if new.starts_on is distinct from old.starts_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'starts_on may only be changed by an administrator';
  end if;

  if new.ends_on is distinct from old.ends_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'ends_on may only be changed by an administrator';
  end if;

  if new.cohort_id is distinct from old.cohort_id
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'cohort_id may only be changed by an administrator';
  end if;

  new.id := old.id;
  return new;
end;
$$;
