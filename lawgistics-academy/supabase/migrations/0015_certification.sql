-- =============================================================================
-- Certification: a coach's own trainees, on their own real cases
-- =============================================================================
-- Everything else in this schema is about people training on our questions, in
-- our diagnostic and skill map. This is not that. A coach who supervises
-- trainees at real firms, on real live files, needs somewhere to record what
-- each trainee has actually produced and how it graded, so that "this person
-- is certified" is something the coach can point at rather than remember.
--
-- The certification model itself (fifteen numbered work products, three grade
-- levels, a fixed rule for what counts as certified) is content the coach
-- designed, not something this schema invents or lets anybody edit: it lives
-- in code, in src/content/seed/certification-boxes.ts, the same way the court
-- hierarchies do. What this migration adds is only the register: who the
-- trainees are, and what they have been assessed on.
--
-- Two tables, both coach-owned in the same shape coach_sessions already is,
-- not the append-only shape onboarding_decisions is. The difference: an
-- onboarding decision is one person's accountability for another person's
-- clearance, and must never quietly change. This is a coach grading their own
-- trainee's own work, closer to a coach correcting their own published
-- session than to a decision about a third party's rights. A mis-graded entry
-- is fixed in place, the same way a coach fixes a session they already put up.
--
-- Trainees are not app users. They have no login, no profile, no row in
-- auth.users: they are lawyers at other firms whose supervisor happens to use
-- this app to keep the register. Everything here is reachable by a coach or
-- administrator only; a learner has no reason to see any of it and no policy
-- gives them one.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'certification_grade') then
    create type certification_grade as enum ('l1_observed', 'l2_assisted', 'l3_independent');
  end if;
end
$$;

create table if not exists public.certification_trainees (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  firm_name  text not null,
  country    country not null default 'MY',
  notes      text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger certification_trainees_touch before update on public.certification_trainees
  for each row execute function public.touch_updated_at();

create table if not exists public.certification_entries (
  id                  uuid primary key default gen_random_uuid(),
  trainee_id          uuid not null references public.certification_trainees (id) on delete cascade,
  box_number          int not null check (box_number between 1 and 15),
  case_no             text not null,
  court_file_ref      text not null default '',
  case_type_stage     text not null default '',
  date_in             date not null default current_date,
  -- Nullable throughout: a box is often assigned before the draft comes back,
  -- and graded only once it does.
  draft_back          date,
  grade               certification_grade,
  -- The coach's own record that the intake screening in the brief (live file,
  -- client consent, no conflict) was actually done, not assumed.
  screening_confirmed boolean not null default false,
  note                text not null default '',
  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create or replace trigger certification_entries_touch before update on public.certification_entries
  for each row execute function public.touch_updated_at();

create index if not exists certification_entries_trainee_idx
  on public.certification_entries (trainee_id, box_number);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.certification_trainees enable row level security;
alter table public.certification_entries enable row level security;

-- Coach-owned, the same shape as coach_sessions: is_coach() already covers an
-- administrator (see 0011_coach.sql), so this is deliberately not "or
-- is_admin()" as well.
drop policy if exists certification_trainees_write on public.certification_trainees;
create policy certification_trainees_write on public.certification_trainees
  for all to authenticated using (public.is_coach()) with check (public.is_coach());

drop policy if exists certification_entries_write on public.certification_entries;
create policy certification_entries_write on public.certification_entries
  for all to authenticated using (public.is_coach()) with check (public.is_coach());
