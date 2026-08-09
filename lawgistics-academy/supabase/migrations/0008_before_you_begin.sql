-- =============================================================================
-- Before you begin: the firm's pre-start checklist, and the person who oversees it
-- =============================================================================
-- 0007 let a firm write its own induction and recorded who had read it. This is
-- the other half, and it is the half a firm actually asks for: somebody starts
-- on a date, and before that date they must have read the right things and
-- signed the right documents, and a named person at the firm has to have
-- checked.
--
-- Four decisions shape this file:
--
--   * The app does not decide anybody is ready. It cannot. It cannot see a
--     signed NDA, it cannot see whether IT set up a mailbox, and it certainly
--     cannot see whether somebody understood a handbook. What it can do is put
--     the list in one place, record what each person has said and done, and
--     then hand the decision to a supervisor whose name goes on it. That is
--     what `onboarding_decisions` is.
--
--   * A person saying they have done something and the firm confirming it are
--     two different facts, and a checklist that conflates them is worth
--     nothing. "I have signed the NDA and posted it" is the joiner's claim.
--     "We have it" is the firm's. They live in two tables, both append-only,
--     because the gap between them is exactly what a supervisor is chasing.
--
--   * Clearing somebody with items still outstanding is allowed, and recorded
--     as such. Firms have real exceptions and a system that forbids them gets
--     worked around outside the system, which is worse than useless. So the
--     count of what was still outstanding is written into the decision itself
--     and cannot be tidied up afterwards.
--
--   * Nothing here is ever edited or deleted. Every table below is insert and
--     select only, for everyone, administrators included. A clearance given in
--     error is withdrawn by recording a withdrawal, not by removing the
--     clearance: the question a firm will one day be asked is not only "was
--     this person cleared" but "who cleared them, when, and what did they know".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- When somebody begins
-- -----------------------------------------------------------------------------
-- Deliberately on the profile rather than in a separate table: a person has one
-- start date, and the whole of this feature is "what is outstanding before it".
alter table public.profiles
  add column if not exists starts_on date;

comment on column public.profiles.starts_on is
  'The date this person begins at the firm. Set by an administrator, not by them.';

-- A start date is the firm's fact about a person, not the person's own setting.
-- Someone who could move their own start date could clear their own deadline,
-- so this joins is_admin behind the existing guard. RLS cannot restrict columns,
-- which is why this is a trigger rather than a policy.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  -- The service role and the database owner are trusted: that is how the first
  -- administrator gets created (scripts/make-admin.ts). Everyone else, including
  -- an authenticated user editing their own row, is blocked.
  if new.is_admin is distinct from old.is_admin
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin may only be changed by an administrator';
  end if;

  if new.starts_on is distinct from old.starts_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'starts_on may only be changed by an administrator';
  end if;

  new.id := old.id;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- The checklist
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'firm_step_kind') then
    -- read: one of the firm's own modules from 0007, finished by acknowledging it.
    -- sign: a document that leaves the app entirely and comes back on paper.
    -- task: anything else the firm needs done. A mailbox, a bank form, a pass.
    create type firm_step_kind as enum ('read', 'sign', 'task');
  end if;
end
$$;

create table if not exists public.firm_steps (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  -- What the person has to actually do, in the firm's words. A checklist item
  -- with no instructions generates a question to somebody's supervisor, which
  -- is the cost this whole feature exists to remove.
  detail         text not null default '',
  kind           firm_step_kind not null default 'task',
  -- Set for a 'read' step and null for everything else, enforced below. A read
  -- step owns no content of its own: it points at a module from 0007 so that
  -- the versioning and the acknowledgement record already built there are the
  -- ones being used, rather than a second, weaker copy of them.
  firm_module_id uuid references public.firm_modules (id) on delete restrict,
  -- Whether the firm has to confirm this, over and above the person saying so.
  -- True for anything the firm can actually observe: a signed document arriving,
  -- a mailbox existing. False where the person's word is the only evidence
  -- there will ever be, and pretending otherwise would be theatre.
  needs_firm_check boolean not null default false,
  -- Null means everyone, as in 0007. An Australian-trained intern at a
  -- Malaysian firm signs the same NDA as everybody else.
  country        country,
  required       boolean not null default true,
  position       integer not null default 0,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- A read step must point at a module, and nothing else may.
  constraint firm_steps_module_matches_kind
    check ((kind = 'read') = (firm_module_id is not null)),

  -- Nobody confirms that somebody else read something. The acknowledgement is
  -- the record for a read step, and a supervisor ticking it as well would be
  -- adding a signature to a fact they cannot see.
  constraint firm_steps_no_check_on_reading
    check (kind <> 'read' or not needs_firm_check)
);

create or replace trigger firm_steps_touch
  before update on public.firm_steps
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- What the person says they have done
-- -----------------------------------------------------------------------------
create table if not exists public.firm_step_declarations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  firm_step_id uuid not null references public.firm_steps (id) on delete restrict,
  declared_at  timestamptz not null default now(),
  unique (user_id, firm_step_id)
);

create index if not exists firm_step_declarations_step_idx
  on public.firm_step_declarations (firm_step_id);

-- -----------------------------------------------------------------------------
-- What the firm has confirmed
-- -----------------------------------------------------------------------------
-- Separate from the declaration on purpose. The whole job of whoever oversees
-- this is the difference between the two lists, and merging them into one row
-- with a nullable column would make "they say they posted it" and "it arrived"
-- the same fact with a flag on it.
create table if not exists public.firm_step_confirmations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  firm_step_id uuid not null references public.firm_steps (id) on delete restrict,
  -- Whose confirmation this is. restrict, because deleting the account of the
  -- person who checked the NDAs must not quietly empty the column that says
  -- somebody checked them.
  confirmed_by uuid not null references auth.users (id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  unique (user_id, firm_step_id)
);

create index if not exists firm_step_confirmations_step_idx
  on public.firm_step_confirmations (firm_step_id);

-- -----------------------------------------------------------------------------
-- The decision
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'onboarding_decision') then
    create type onboarding_decision as enum ('cleared', 'withdrawn');
  end if;
end
$$;

-- An append-only log, not a status column. The current state is the most recent
-- row. Clearing somebody in error is undone by recording a withdrawal, which is
-- itself a dated act by a named person, because the alternative is a record
-- that can be made to have always said the right thing.
create table if not exists public.onboarding_decisions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  decision          onboarding_decision not null,
  decided_by        uuid not null references auth.users (id) on delete restrict,
  decided_at        timestamptz not null default now(),
  -- How many required items were still outstanding at the moment of the
  -- decision, counted by the server. A firm is allowed to clear somebody early
  -- and sometimes has to; what it is not allowed to do is have that look
  -- afterwards like everything had been done.
  outstanding_count integer not null default 0 check (outstanding_count >= 0),
  note              text not null default ''
);

create index if not exists onboarding_decisions_user_idx
  on public.onboarding_decisions (user_id, decided_at desc);

-- -----------------------------------------------------------------------------
-- Server-stamped timestamps
-- -----------------------------------------------------------------------------
-- As in 0007: the date is the entire evidentiary value of every table above, so
-- it is the database's and never the request's. Without these, a client could
-- name the date on which it signed an NDA.
create or replace function public.stamp_declared_at()
returns trigger language plpgsql as $$
begin
  new.declared_at := now();
  return new;
end;
$$;

create or replace trigger firm_step_declarations_stamp
  before insert on public.firm_step_declarations
  for each row execute function public.stamp_declared_at();

create or replace function public.stamp_confirmed_at()
returns trigger language plpgsql as $$
begin
  new.confirmed_at := now();
  return new;
end;
$$;

create or replace trigger firm_step_confirmations_stamp
  before insert on public.firm_step_confirmations
  for each row execute function public.stamp_confirmed_at();

create or replace function public.stamp_decided_at()
returns trigger language plpgsql as $$
begin
  new.decided_at := now();
  return new;
end;
$$;

create or replace trigger onboarding_decisions_stamp
  before insert on public.onboarding_decisions
  for each row execute function public.stamp_decided_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.firm_steps              enable row level security;
alter table public.firm_step_declarations  enable row level security;
alter table public.firm_step_confirmations enable row level security;
alter table public.onboarding_decisions    enable row level security;

drop policy if exists firm_steps_read on public.firm_steps;
create policy firm_steps_read on public.firm_steps
  for select to authenticated using (published or public.is_admin());
drop policy if exists firm_steps_admin on public.firm_steps;
create policy firm_steps_admin on public.firm_steps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A person declares their own steps and nobody else's, and cannot take a
-- declaration back. Insert and select only, with no admin write policy: an
-- administrator who could declare on somebody's behalf would turn "they told us
-- they had signed it" into something the firm had said to itself.
drop policy if exists firm_step_declarations_insert_own on public.firm_step_declarations;
create policy firm_step_declarations_insert_own on public.firm_step_declarations
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists firm_step_declarations_select_own on public.firm_step_declarations;
create policy firm_step_declarations_select_own on public.firm_step_declarations
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Only an administrator confirms, only in their own name, and never afterwards.
-- `confirmed_by = auth.uid()` is the part that matters: without it an
-- administrator could write somebody else's name into the column that says who
-- checked, which is the one column the record is for.
drop policy if exists firm_step_confirmations_insert on public.firm_step_confirmations;
create policy firm_step_confirmations_insert on public.firm_step_confirmations
  for insert to authenticated
  with check (public.is_admin() and confirmed_by = auth.uid());
drop policy if exists firm_step_confirmations_select on public.firm_step_confirmations;
create policy firm_step_confirmations_select on public.firm_step_confirmations
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Same shape, and for the same reason. A person may read the decision made
-- about them, which is not a courtesy: being cleared to begin work, or not, is
-- a thing they are entitled to see.
drop policy if exists onboarding_decisions_insert on public.onboarding_decisions;
create policy onboarding_decisions_insert on public.onboarding_decisions
  for insert to authenticated
  with check (public.is_admin() and decided_by = auth.uid());
drop policy if exists onboarding_decisions_select on public.onboarding_decisions;
create policy onboarding_decisions_select on public.onboarding_decisions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
