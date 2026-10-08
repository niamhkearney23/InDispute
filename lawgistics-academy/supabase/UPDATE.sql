-- =============================================================================
-- Litigation Academy: update an existing database
-- =============================================================================
-- Paste this whole file into the Supabase SQL editor and run it.
--
-- Use this one if you have set the app up before and the database already has
-- tables in it. Use SETUP.sql instead only on a brand new, empty project.
--
-- Running this more than once is safe. Every statement in it checks first, so
-- if you have already applied some of these it will apply the rest and leave
-- what is there alone. Nothing in it deletes anything.
--
-- Generated from supabase/migrations/. Do not edit by hand.
--
-- Contains, in order:
--   0004_malaysia.sql
--   0005_court_hierarchy_questions.sql
--   0006_signup_country.sql
--   0007_firm_modules.sql
--   0008_before_you_begin.sql
--   0009_joining.sql
--   0010_verification_expires.sql
--   0011_coach.sql
--   0012_coach_videos.sql
--   0013_restore_start_date_guard.sql
--   0014_avatars.sql
--   0015_certification.sql
--   0016_placement_dates.sql
--   0017_homework.sql
--   0018_learner_track.sql
--   0019_work_board.sql
--   0020_work_memos_messages_slots.sql
--   0021_invite_track_and_first_password.sql
--   0022_close_direct_writes.sql
--   0023_trainee_approval.sql
--   0024_second_audit.sql
--   0025_leaderboard.sql
--   0026_trainee_videos_and_comments.sql
--   0027_matters.sql
--   0028_draft_matters.sql
--   0029_email_work.sql
--   0030_access.sql
--   0031_tutor.sql
--   0032_lesson_signoffs.sql
--   0033_cartoon_avatar.sql
--   0034_trainee_answer_summary.sql
--   0035_relabel_questions.sql
--   0036_third_audit.sql
--   0038_jurisdiction_and_tutor.sql
-- =============================================================================


-- >>> 0004_malaysia.sql -------------------------------------------

-- =============================================================================
-- 0004  Malaysia
-- =============================================================================
-- Adds a second legal system. Australian and Malaysian civil procedure are
-- different bodies of law, so this is not a display preference: a learner is
-- only ever served questions from their own country, and onboarding asks which
-- one before it asks anything else.
--
-- Note on ordering. Postgres will not let a value added by ALTER TYPE ADD VALUE
-- be used in the same transaction that added it, and the combined SETUP.sql
-- runs every migration in one go. So this file adds the jurisdictions and does
-- not reference them anywhere below. The Malaysian defaults live in the
-- application, which is also where the country to jurisdiction mapping is
-- asserted by tests.
-- =============================================================================

alter type jurisdiction add value if not exists 'MY_GENERAL';
alter type jurisdiction add value if not exists 'MY_FEDERAL';
alter type jurisdiction add value if not exists 'MY_MALAYA';
alter type jurisdiction add value if not exists 'MY_SABAH_SARAWAK';

-- A freshly created enum may be used immediately; the restriction above applies
-- only to values added to an existing type.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'country') then
    create type country as enum ('AU', 'MY');
  end if;
end
$$;

-- Every existing learner and every existing question is Australian, which is
-- what the default records. Nothing is guessed from the jurisdiction column,
-- because at this point nothing in the database can be anything else.
alter table public.profiles
  add column if not exists country country not null default 'AU';

alter table public.questions
  add column if not exists country country not null default 'AU';

alter table public.daily_facts
  add column if not exists country country not null default 'AU';

-- Selection filters on this on every session, for every learner.
create index if not exists questions_country_status_idx
  on public.questions (country, status);

create index if not exists daily_facts_country_status_idx
  on public.daily_facts (country, status);

-- The delivery view omits answer keys and is what learners read through. It has
-- to carry country too, or selection would have to join back to `questions`
-- and defeat the point of the view.
drop view if exists public.v_question_delivery;

create view public.v_question_delivery
with (security_invoker = false) as
select
  q.id                as question_id,
  q.slug,
  q.country,
  q.domain_id,
  d.slug              as domain_slug,
  d.name              as domain_name,
  qv.id               as question_version_id,
  qv.version,
  qv.question_type,
  qv.scenario,
  qv.stem,
  qv.options,
  qv.difficulty,
  qv.jurisdiction,
  qv.court
from public.questions q
join public.question_versions qv
  on qv.question_id = q.id and qv.is_current
join public.domains d on d.id = q.domain_id
where q.status = 'published';

revoke all on public.v_question_delivery from anon, authenticated;
grant select on public.v_question_delivery to authenticated;

comment on view public.v_question_delivery is
  'Questions as a learner may see them: no answer key, no explanation. Country '
  'is carried so a session can be filtered to one legal system without joining '
  'back to a table learners cannot read.';


-- >>> 0005_court_hierarchy_questions.sql --------------------------

-- =============================================================================
-- 0005  Court hierarchy questions
-- =============================================================================
-- A question type that draws the court hierarchy and asks the learner to pick a
-- court from it, rather than from a list of sentences.
--
-- Nothing else changes. The options are the courts and the answer key is the
-- right one, so grading, the immutable version history and the attempt ledger
-- are all untouched: this is a way of presenting a question, not a new way of
-- being right.
--
-- As in 0004, the new value is added here and used nowhere in this file, since
-- Postgres will not let a value added by ALTER TYPE ADD VALUE be used in the
-- transaction that added it, and SETUP.sql runs every migration in one go.
-- =============================================================================

alter type question_type add value if not exists 'court_hierarchy';


-- >>> 0006_signup_country.sql -------------------------------------

-- =============================================================================
-- 0006  Country chosen at signup
-- =============================================================================
-- The country question moves to the signup page, so a Malaysian visitor can see
-- the app covers them before deciding whether to create an account. Onboarding
-- still asks, pre-set to this answer, because it is the question that decides
-- what a learner is ever shown and it deserves confirming.
--
-- The value arrives in the auth user's metadata, which is written by the client
-- at signup. It is therefore untrusted: anything could be in there. It is
-- narrowed to 'MY' here, and anything else, including nothing, becomes 'AU'.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'country' = 'MY' then 'MY' else 'AU' end::country
  )
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


-- >>> 0007_firm_modules.sql ---------------------------------------

-- =============================================================================
-- Firm modules: the firm's own induction, in the firm's own words
-- =============================================================================
-- Everything in this database so far is content we wrote and we verify. A
-- firm's welcome and a firm's AI policy are neither. They are the firm's words,
-- about the firm's rules, and a firm will not accept somebody else writing them
-- or signing them off. So they live in their own tables, with their own
-- lifecycle, and they touch nothing that the training loop reads.
--
-- Three things follow from that, and they are the whole design:
--
--   * Firm content never enters the review queue. /admin/review exists to sign
--     off statements of law we are answerable for. A firm's policy is not a
--     statement of law and we are not answerable for it. There is deliberately
--     no verification_status column here.
--
--   * Firm content never enters the training pool. No spaced repetition, no
--     diagnostic, no mastery. An induction is a record that something was
--     covered on a date, not a skill to be strengthened.
--
--   * An acknowledgement is pinned to the version that was read. This is the
--     part a firm is actually buying. "Everyone has read the AI policy" is
--     worth nothing if the policy changed in March; what a firm needs to be
--     able to say is who has read the policy as it stands today. Publish a new
--     version and it is outstanding again for everyone, which is correct and
--     is the reason it is versioned rather than edited in place.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'firm_module_kind') then
    create type firm_module_kind as enum ('welcome', 'policy');
  end if;
end
$$;

create table if not exists public.firm_modules (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  summary     text not null default '',
  -- A welcome is read. A policy is read and acknowledged. The difference is
  -- whether finishing it produces a record with somebody's name on it.
  kind        firm_module_kind not null default 'policy',
  -- Null means everyone, and null is the default on purpose. A firm's own
  -- rules apply to whoever walks through the door, and this app already
  -- supports an Australian-trained intern sitting in a Malaysian firm. Scoping
  -- firm content by the country on a learner's account would hide the firm's
  -- AI policy from exactly the people most likely to need telling.
  country     country,
  required    boolean not null default true,
  position    integer not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- `or replace` throughout the rest of this file, so the whole thing can be run
-- again on a database that already has some of it. The people setting this up
-- are not developers and will not know which half they already applied; a
-- second paste that errors halfway is worse than no guard at all.
create or replace trigger firm_modules_touch
  before update on public.firm_modules
  for each row execute function public.touch_updated_at();

create table if not exists public.firm_module_versions (
  id             uuid primary key default gen_random_uuid(),
  firm_module_id uuid not null references public.firm_modules (id) on delete cascade,
  version        integer not null,
  body           text not null,
  is_current     boolean not null default true,
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  unique (firm_module_id, version)
);

-- One current version per module, enforced here rather than remembered in the
-- application. Two current versions means two different answers to "what does
-- the policy say", and the acknowledgements stop meaning anything.
create unique index if not exists firm_module_versions_current_idx
  on public.firm_module_versions (firm_module_id)
  where is_current;

create table if not exists public.firm_module_acknowledgements (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  -- restrict, not cascade. A version somebody has acknowledged cannot be
  -- deleted, and because deleting a module cascades to its versions, an
  -- acknowledged module cannot be deleted either. Unpublish it instead. A
  -- compliance record that disappears when somebody tidies up is not a record.
  firm_module_version_id uuid not null
    references public.firm_module_versions (id) on delete restrict,
  acknowledged_at        timestamptz not null default now(),
  unique (user_id, firm_module_version_id)
);

create index if not exists firm_ack_version_idx
  on public.firm_module_acknowledgements (firm_module_version_id);

-- The timestamp is the database's, not the client's. Without this a request
-- could name its own acknowledgement date, and the one column the whole record
-- rests on would be a value somebody chose.
create or replace function public.stamp_acknowledgement()
returns trigger language plpgsql as $$
begin
  new.acknowledged_at := now();
  return new;
end;
$$;

create or replace trigger firm_module_ack_stamp
  before insert on public.firm_module_acknowledgements
  for each row execute function public.stamp_acknowledgement();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.firm_modules                enable row level security;
alter table public.firm_module_versions        enable row level security;
alter table public.firm_module_acknowledgements enable row level security;

drop policy if exists firm_modules_read on public.firm_modules;
create policy firm_modules_read on public.firm_modules
  for select to authenticated using (published or public.is_admin());
drop policy if exists firm_modules_admin on public.firm_modules;
create policy firm_modules_admin on public.firm_modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A learner reads the current version of a published module and nothing else.
-- Drafts and superseded versions are not theirs to see: a superseded policy is
-- the thing they must not be following.
drop policy if exists firm_module_versions_read on public.firm_module_versions;
create policy firm_module_versions_read on public.firm_module_versions
  for select to authenticated using (
    public.is_admin()
    or (
      is_current
      and exists (
        select 1 from public.firm_modules m
        where m.id = firm_module_id and m.published
      )
    )
  );
drop policy if exists firm_module_versions_admin on public.firm_module_versions;
create policy firm_module_versions_admin on public.firm_module_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Insert and select only, and no admin write policy at all. There is
-- deliberately no way through this API for a learner to withdraw an
-- acknowledgement or for an administrator to add one on someone's behalf. The
-- record says a named person pressed the button on a date, and it is worth
-- having only for as long as that stays true.
drop policy if exists firm_ack_insert_own on public.firm_module_acknowledgements;
create policy firm_ack_insert_own on public.firm_module_acknowledgements
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists firm_ack_select_own on public.firm_module_acknowledgements;
create policy firm_ack_select_own on public.firm_module_acknowledgements
  for select to authenticated using (user_id = auth.uid() or public.is_admin());


-- >>> 0008_before_you_begin.sql -----------------------------------

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


-- >>> 0009_joining.sql --------------------------------------------

-- =============================================================================
-- Joining: the firm starts the process, not the joiner
-- =============================================================================
-- 0008 gave a joiner a checklist and gave the firm somebody to oversee it, but
-- it still assumed the joiner had found the sign-up page and made an account
-- by themselves, and that somebody at the firm had then found them in a list
-- and typed in a start date. That is not "everyone joins through the app",
-- it is "everyone joins, and then the app finds out".
--
-- So the firm invites them. An administrator enters a name, an email and a
-- start date, and gets a link. The person opens it, sets a password, and lands
-- on their own checklist with their start date already on it. There is one
-- path into the firm and it runs through here.
--
-- What that means for this table:
--
--   * The link is the credential, so the token is never stored. Only a SHA-256
--     hash of it is, exactly as a password would be. Somebody who gets read
--     access to this table gets a list of hashes and no way into anybody's
--     account.
--
--   * The invitation carries the email, the name, the country and the start
--     date. None of those are asked for on the joining form, because a form
--     that asked would let whoever held the link decide who they were joining
--     as, and the start date is the firm's fact about somebody rather than
--     theirs.
--
--   * There is deliberately no column here that could grant administrator
--     rights. An invitation is the least privileged thing in this database and
--     it is handed to people who do not work here yet.
-- =============================================================================

create table if not exists public.joiner_invitations (
  id            uuid primary key default gen_random_uuid(),
  -- SHA-256 of the token, hex. The token itself exists only in the link.
  token_hash    text not null unique,
  email         text not null,
  display_name  text not null default '',
  -- Nullable, because a firm does not always know the start date when it makes
  -- the offer, and an invitation that had to wait for one would be sent late.
  starts_on     date,
  country       country not null default 'AU',
  invited_by    uuid not null references auth.users (id) on delete restrict,
  invited_at    timestamptz not null default now(),
  -- A link that works forever is a credential nobody remembers issuing.
  expires_at    timestamptz not null default now() + interval '14 days',
  accepted_at   timestamptz,
  accepted_by   uuid references auth.users (id) on delete set null,
  revoked_at    timestamptz,

  -- An invitation cannot be both taken up and called back.
  constraint joiner_invitations_one_outcome
    check (accepted_at is null or revoked_at is null),
  -- If it was accepted, we know by whom.
  constraint joiner_invitations_accepted_by_known
    check ((accepted_at is null) = (accepted_by is null))
);

-- One live invitation per person. Without this, resending an invitation twice
-- leaves two working links, and revoking the one somebody remembers sending
-- does not close the door. Case-insensitive, because nobody types their own
-- email address the same way twice.
create unique index if not exists joiner_invitations_pending_email_idx
  on public.joiner_invitations (lower(email))
  where accepted_at is null and revoked_at is null;

create index if not exists joiner_invitations_pending_idx
  on public.joiner_invitations (invited_at desc)
  where accepted_at is null and revoked_at is null;

-- The dates are the database's, as everywhere else in this feature. An
-- invitation that could name its own expiry is not an expiry.
create or replace function public.stamp_invited_at()
returns trigger language plpgsql as $$
begin
  new.invited_at := now();
  -- Only on insert: an administrator extending an expiry later is a legitimate
  -- thing to do, and this trigger does not run on update anyway.
  if new.expires_at is null or new.expires_at > now() + interval '30 days' then
    new.expires_at := now() + interval '14 days';
  end if;
  new.accepted_at := null;
  new.accepted_by := null;
  new.revoked_at := null;
  return new;
end;
$$;

create or replace trigger joiner_invitations_stamp
  before insert on public.joiner_invitations
  for each row execute function public.stamp_invited_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.joiner_invitations enable row level security;

-- Administrators only, and nobody else at all. There is deliberately no policy
-- letting a signed-in learner read this table: the hashes are useless to them,
-- but the list of who is about to join a firm and when is not nothing, and
-- there is no reason for anybody but an administrator to have it.
--
-- The joining page itself is opened by somebody with no account, so it is read
-- through the service role rather than by a policy here. That is the same
-- pattern the rest of the app uses for work a signed-out visitor must do, and
-- it is why the token is hashed: the lookup is by hash, so the page cannot be
-- made to return a row by anybody who has not been given the link.
drop policy if exists joiner_invitations_admin on public.joiner_invitations;
create policy joiner_invitations_admin on public.joiner_invitations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- >>> 0010_verification_expires.sql -------------------------------

-- =============================================================================
-- Verification expires, so the record stays true for as long as the firm has it
-- =============================================================================
-- Until now, `human_verified` was permanent. A lawyer signed an item off once
-- and it stayed signed off, for good.
--
-- That is fine for a demonstration and wrong for something a firm keeps. Rules
-- of court are amended. Practice notes are reissued. The Bar Council replaced
-- its 2023 AI circular in 2025. None of that touches a verification stamp, so
-- the longer the app runs the more of its content is confidently wrong, and the
-- stamp that was the whole point becomes the thing doing the damage: an item
-- nobody has checked at least looks unchecked.
--
-- So a verification now has a date it runs out on, and when it does the item
-- goes back into the queue by itself. Three things follow:
--
--   * The reviewer chooses how long it holds. They are the only one who knows
--     whether they just verified that the plaintiff bears the onus of proof or
--     that a filing fee is RM 100. A regex cannot tell those apart and should
--     not try; the queue's risk score only picks the default.
--
--   * A verified row cannot exist without a date. Enforced by a trigger rather
--     than a constraint, so rows written before this migration are repaired on
--     the way past instead of rejected.
--
--   * Losing verification clears the date. An item that was flagged is not
--     "verified until March", it is not verified.
-- =============================================================================

alter table public.question_versions
  add column if not exists review_due_on date;

alter table public.daily_facts
  add column if not exists review_due_on date;

comment on column public.question_versions.review_due_on is
  'When this verification runs out and the item returns to the review queue.';
comment on column public.daily_facts.review_due_on is
  'When this verification runs out and the item returns to the review queue.';

-- -----------------------------------------------------------------------------
-- No verification without an expiry
-- -----------------------------------------------------------------------------
-- A default rather than a rule: twelve months is what the application sends
-- when nobody chooses, and this is the backstop for anything that reaches the
-- table another way.
create or replace function public.stamp_review_due()
returns trigger language plpgsql as $$
begin
  if new.verification_status = 'human_verified' then
    if new.review_due_on is null then
      new.review_due_on := current_date + interval '12 months';
    end if;
  else
    -- Not verified means not verified. Carrying the old date forward would
    -- leave a flagged item looking like it had been signed off until March.
    new.review_due_on := null;
  end if;
  return new;
end;
$$;

create or replace trigger question_versions_review_due
  before insert or update on public.question_versions
  for each row execute function public.stamp_review_due();

create or replace trigger daily_facts_review_due
  before insert or update on public.daily_facts
  for each row execute function public.stamp_review_due();

-- Anything signed off before this migration existed. Given a year from today
-- rather than backdated: the sign-off was real, it simply had no end date, and
-- inventing one in the past would put the whole bank into the queue at once and
-- teach everybody to ignore it.
update public.question_versions
  set review_due_on = current_date + interval '12 months'
  where verification_status = 'human_verified' and review_due_on is null;

update public.daily_facts
  set review_due_on = current_date + interval '12 months'
  where verification_status = 'human_verified' and review_due_on is null;

-- -----------------------------------------------------------------------------
-- Finding what has lapsed
-- -----------------------------------------------------------------------------
create index if not exists question_versions_review_due_idx
  on public.question_versions (review_due_on)
  where verification_status = 'human_verified';

create index if not exists daily_facts_review_due_idx
  on public.daily_facts (review_due_on)
  where verification_status = 'human_verified';


-- >>> 0011_coach.sql ----------------------------------------------

-- =============================================================================
-- The coach: a lawyer who signs content off and watches their people, and who
-- is not handed the keys to the product to do it
-- =============================================================================
-- There was one permission flag, `is_admin`, and it meant everything: sign off
-- questions, rewrite questions, invite people, edit the firm's own documents,
-- run setup. Fine while the only administrator was the person who built it.
--
-- It stops being fine the moment a firm buys this. The lawyer who supervises
-- the paralegals is not a one-off reviewer who signs a batch and leaves. They
-- are the coach. They log in every week, they decide whether content is sound,
-- and they decide whether a person is ready to be put in front of a client.
-- Giving them `is_admin` to do that hands them the question bank as well, and
-- an account with rights nobody intended is how a record a firm relies on stops
-- being reliable.
--
-- So there are two flags now.
--
--   * A coach signs content off, and records the supervisor decisions about
--     their own people. Those are judgements only a practitioner can make, and
--     they are the whole reason the role exists.
--
--   * A coach does not write content. Editing a question mints a new version
--     and clears its sign-off, so somebody who could both edit and verify could
--     rewrite an item and sign their own rewrite in one sitting, with the audit
--     trail showing an ordinary review. The queue already lets them flag an
--     item with a note saying what is wrong, and a flag without a note is
--     refused. That is the route: the coach says it is wrong, somebody else
--     changes it, and the two acts stay separate and attributable.
--
-- An administrator is a coach as well. Every place that asks "may this person
-- coach" gets yes for an administrator, because the alternative is an
-- administrator locked out of the review queue by a flag they did not set.
--
-- Neither flag can be granted from the browser. `is_admin` was already guarded
-- by a trigger, and the guard is widened to cover `is_coach` here, because a
-- coach who could promote themselves to coach could promote anybody.
-- =============================================================================

alter table public.profiles
  add column if not exists is_coach boolean not null default false;

comment on column public.profiles.is_coach is
  'May sign content off in the review queue and record supervisor decisions. '
  'Does not imply any right to write content. Administrators are coaches too, '
  'so read this through public.is_coach() rather than directly.';

-- SECURITY DEFINER for the same reason is_admin() is: policies on `profiles`
-- call it, and it must not recurse through their own RLS.
--
-- An administrator answers true. Every caller asks "may this person coach",
-- never "is this person only a coach", so folding the two together here means
-- no call site has to remember to check both and none can forget.
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_coach or p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- The privilege guard, widened. Same rule for both flags: only an existing
-- administrator may change them, and the service role and database owner are
-- trusted so the first administrator can be created at all.
--
-- Deliberately NOT security definer, unchanged from the original: this has to
-- see the *calling* role in `current_user`. Running it as its owner would make
-- every caller look like the database owner and the check would pass for
-- anyone.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin and is_coach may only be changed by an administrator';
  end if;
  new.id := old.id;
  return new;
end;
$$;

-- Row Level Security is deliberately NOT widened for coaches.
--
-- Every page a coach uses is a server component reading through the service
-- role client, which bypasses RLS entirely and is gated by requireCoach() in
-- application code. Granting the browser session direct select on other
-- people's profiles would buy nothing, because nothing asks for it that way,
-- and would widen what a stolen session token reaches. The floor stays where
-- it is.


-- >>> 0012_coach_videos.sql ---------------------------------------

-- =============================================================================
-- Sessions: the coach's own teaching, published by the coach, watched by their
-- people at seven in the morning
-- =============================================================================
-- The training runs seven to eight, daily. Until now everything a learner could
-- open at seven was written months earlier by somebody who is not in the room:
-- our questions, our lessons, both compiled into the application and unchangeable
-- without a developer and a deployment.
--
-- The coach is in the room. They know what went wrong in court on Tuesday and
-- what the juniors got wrong last week, and they cannot put any of it in front
-- of anybody. That is the gap this closes. They record something, publish it,
-- and it is there the next morning.
--
-- Three decisions, and they are the design.
--
--   * A COACH MAY PUBLISH THESE, and that does not break the rule that a coach
--     may not write content. That rule is about the question bank: versioned,
--     immutable, carrying an answer key and a sign-off somebody is answerable
--     for, feeding a training engine that decides what a learner sees next.
--     A session is none of those things. It is the coach's own teaching, under
--     the coach's own name, that nobody signs off because nobody else is
--     standing behind it. Keeping the coach out of it would leave the person
--     who actually teaches these juniors unable to teach them.
--
--   * SESSIONS NEVER ENTER THE REVIEW QUEUE, for the same reason firm content
--     does not. The queue exists to sign off statements of law we are
--     answerable for. There is deliberately no verification_status here, and
--     there must not be one: a stamp saying a video had been checked, on a
--     recording nobody transcribed, would be the most misleading thing in the
--     product.
--
--   * SESSIONS NEVER ENTER THE TRAINING POOL. No spaced repetition, no
--     diagnostic, no mastery. Watching is not answering, and a system that
--     counted a video as evidence of a skill would be lying to a firm about
--     what its juniors can do.
--
-- The url is checked twice. Here, so a row that could frame an arbitrary page
-- cannot exist at all, and again in the application before it is rendered. An
-- iframe src is somebody else's page running inside ours, so the question is
-- never whether a link looks safe but whether we chose the host.
-- =============================================================================

create table if not exists public.coach_sessions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  -- What it covers, so somebody deciding whether to watch at seven in the
  -- morning can decide before pressing play rather than after four minutes.
  summary      text not null default '',
  url          text not null,

  -- Null means everyone. Unlike a question, which is always the law of exactly
  -- one place, a coach talking about how to run a file is often talking about
  -- craft that travels. Making them choose a country would push them to pick
  -- one rather than say "both", and the wrong half would never see it.
  country      country,

  -- The morning it belongs to. Nullable, because not everything is a daily
  -- session: some of it is a library somebody works through in their own time.
  -- When it is set, it is the day the session leads with.
  airs_on      date,

  published    boolean not null default false,

  -- Who put it there. Not decoration: this is somebody's teaching appearing in
  -- front of juniors under the firm's roof, and it should say whose.
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,

  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- The same allowlist the player enforces, as a constraint, so it holds against
-- anything that writes to this table rather than only against the one form that
-- is supposed to. Named hosts rather than a pattern: a rule clever enough to
-- match "any video site" is clever enough to match somewhere we did not choose.
alter table public.coach_sessions
  drop constraint if exists coach_sessions_url_host;
alter table public.coach_sessions
  add constraint coach_sessions_url_host check (
    url ~ '^https://(www\.)?(youtube\.com|youtube-nocookie\.com)/'
    or url ~ '^https://player\.vimeo\.com/'
  );

-- A published session must say who published it and when. Without this, "the
-- coach published it" is an assertion nobody can stand behind, which is the
-- same failure the whole product exists to avoid.
create or replace function public.stamp_coach_session()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;

create or replace trigger coach_sessions_stamp
  before insert or update on public.coach_sessions
  for each row execute function public.stamp_coach_session();

create or replace trigger coach_sessions_touch
  before update on public.coach_sessions
  for each row execute function public.touch_updated_at();

create index if not exists coach_sessions_airing_idx
  on public.coach_sessions (airs_on desc nulls last)
  where published;

alter table public.coach_sessions enable row level security;

-- A learner sees what is published and nothing else. A draft is the coach
-- part-way through writing a title.
drop policy if exists coach_sessions_read on public.coach_sessions;
create policy coach_sessions_read on public.coach_sessions
  for select to authenticated using (published or public.is_coach());

-- And a coach may write them. This is the one place in the product where that
-- is true, and it is deliberate: see the note at the top of this file.
drop policy if exists coach_sessions_write on public.coach_sessions;
create policy coach_sessions_write on public.coach_sessions
  for all to authenticated using (public.is_coach()) with check (public.is_coach());


-- >>> 0013_restore_start_date_guard.sql ---------------------------

-- =============================================================================
-- Restoring a guard that 0011_coach.sql silently deleted
-- =============================================================================
-- guard_profile_privileges() is redefined three times across this history:
-- 0001_init.sql wrote it to protect is_admin. 0008_before_you_begin.sql
-- redefined the whole function to protect starts_on as well, because a joiner
-- who could move their own start date could move their own deadline, and the
-- comment on that column says exactly that: "Set by an administrator, not by
-- them." 0011_coach.sql redefined the whole function again to add is_coach,
-- but it was written against 0001's version rather than 0008's, so the
-- starts_on clause was not carried forward. `create or replace function`
-- replaces the entire body: from the moment 0011 ran, a joiner could set their
-- own starts_on to whatever they liked, and nothing objected.
--
-- This was not caught by anything that ran before this was written, because
-- proving it needs a real Postgres: RLS and a trigger are exactly the two
-- things a mocked backend cannot exercise, and this repository's own schema
-- guarantee suite, which does run against real Postgres and does have a test
-- for precisely this, had apparently not been run against a real database
-- since 0011 was added. It was run here, deliberately, and found this on the
-- first attempt.
--
-- The lesson generalises past this one column: a function redefined by more
-- than one migration is redefining the WHOLE function, not adding to it, and
-- every migration that touches one has to be checked against the CURRENT body,
-- not the one it happened to have open. There is now a structural test for
-- that shape of mistake (tests/coach.test.ts), and this migration is the
-- immediate fix: restore the clause, keep everything 0011 added.
-- =============================================================================

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin and is_coach may only be changed by an administrator';
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


-- >>> 0014_avatars.sql --------------------------------------------

-- =============================================================================
-- Avatars: a person's own photo, on their own account
-- =============================================================================
-- Nothing in this product currently puts a face to a name. The one place that
-- would matter most is the coach's own session card, which already says whose
-- teaching it is; a photo next to that name is a real, honest detail rather
-- than a stock image standing in for one, which is why this is a photo people
-- upload of themselves rather than anything chosen for them.
--
-- A photo is not legal content and it is not a firm record, so it sits outside
-- every rule written for those: no version chain, no sign-off, no review queue.
-- It is closer to a display name than to a question. What it is not is free of
-- Row Level Security: a bucket that let anybody overwrite anybody else's file
-- would be a stranger's photo appearing under a different person's name, and
-- that is worse than no photo at all.
--
-- One file per person, at `{user_id}/avatar`, upsert on re-upload. The bucket
-- is public because a photo on a training page is not a secret and every place
-- it is shown, a plain <img src>, needs to load it without a session.
-- =============================================================================

alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anybody may look. The next three policies are the ones that matter: they are
-- what stops the read policy from being the only thing standing between one
-- person's account and another person's photo.
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select to public using (bucket_id = 'avatars');

-- Write access is scoped to the first path segment, which the application
-- always sets to the uploader's own id. Nobody, including a learner who has
-- read the source of the upload form, can write to a path that does not start
-- with their own auth.uid().
drop policy if exists avatars_write_own on storage.objects;
create policy avatars_write_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );


-- >>> 0015_certification.sql --------------------------------------

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


-- >>> 0016_placement_dates.sql ------------------------------------

-- =============================================================================
-- Placement dates and an assigned essay topic
-- =============================================================================
-- The first piece of the placement program described in "Lawgistics
-- Academy: the brief": a learner on a fixed-length placement (Kuala Lumpur,
-- to start) has a start date and an end date, sits the diagnostic on day
-- one and again near the end, and the two skill maps sit side by side. Most
-- of that already existed: the diagnostic already supports being retaken,
-- and every sitting is already an immutable, timestamped snapshot in
-- diagnostic_results. What was missing is an end date to go with starts_on,
-- and somewhere to remember the one comparison essay topic assigned on day
-- one.
--
-- ends_on follows starts_on exactly: admin-only write, enforced by the same
-- trigger. That trigger has been redefined three times before this
-- migration (0001, 0008, 0011, restored by 0013 after 0011 silently dropped
-- 0008's clause). The lesson from that mistake is carried forward here: this
-- redefinition keeps every earlier clause and adds one.
-- =============================================================================

alter table public.profiles add column if not exists ends_on date;

comment on column public.profiles.ends_on is
  'The last day of a placement or program. Set by an administrator, not by '
  'them, for the same reason starts_on is: a person who could move their own '
  'end date could give themselves a longer, or shorter, placement than the '
  'one they were actually offered.';

alter table public.diagnostic_results
  add column if not exists essay_topic_slug text;

comment on column public.diagnostic_results.essay_topic_slug is
  'Set only on a learner''s first diagnostic, from their weakest priority '
  'domain. A later retake never reassigns it: the essay is set once, on day '
  'one, the same way the placement itself is.';

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin and is_coach may only be changed by an administrator';
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

  new.id := old.id;
  return new;
end;
$$;


-- >>> 0017_homework.sql -------------------------------------------

-- =============================================================================
-- Daily homework
-- =============================================================================
-- The next piece of the placement program in "Lawgistics Academy: the
-- brief": four weeks of daily homework, one task per working day, tied to
-- the learner's own start date rather than to a firm-wide calendar.
--
-- A task here is something the person does in the firm, not something they
-- read about the law, so nothing in it needs a lawyer's sign-off and none of
-- it enters the review queue. The tasks themselves live in code
-- (src/content/seed/homework.ts) for the same reason the certification boxes
-- do: twenty fixed items that a firm adjusts once, not content anybody edits
-- in the app.
--
-- This table holds one fact and nothing else: that a person said they had
-- done day N. No marking, no confirmation, no upload. It is the same trust
-- model as an ordinary firm step that needs no firm check, and the same
-- append-only treatment, because it is a record a firm may later rely on to
-- show what an intern was set and what they said they did.
-- =============================================================================

create table if not exists public.homework_declarations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,

  -- Which working day of their own placement, one to twenty. Bounded here and
  -- not merely in the application: a row for day 37 would be a record of
  -- homework that does not exist. Four weeks is twenty working days, and a
  -- longer program is a migration rather than a silently wider column.
  day         smallint not null check (day between 1 and 20),

  -- The task as it stood when they ticked it. If the firm rewrites day three
  -- next year, this row still says which task was actually done.
  task_slug   text not null,

  declared_at timestamptz not null default now(),

  unique (user_id, day)
);

create index if not exists homework_declarations_user_idx
  on public.homework_declarations (user_id, day);

-- As in 0008: the date is the whole evidentiary value of the row, so it is
-- the database's and never the request's.
create or replace trigger homework_declarations_stamp
  before insert on public.homework_declarations
  for each row execute function public.stamp_declared_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.homework_declarations enable row level security;

-- Insert and select only, exactly as firm_step_declarations. There is no
-- update or delete policy for anybody, administrators included: an
-- administrator who could tick somebody's homework, or untick it, would turn
-- "they told us they had done it" into something the firm said to itself.
drop policy if exists homework_declarations_insert_own on public.homework_declarations;
create policy homework_declarations_insert_own on public.homework_declarations
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists homework_declarations_select_own on public.homework_declarations;
create policy homework_declarations_select_own on public.homework_declarations
  for select to authenticated using (user_id = auth.uid() or public.is_admin());


-- >>> 0018_learner_track.sql --------------------------------------

-- =============================================================================
-- Which programme somebody is on
-- =============================================================================
-- The signup and onboarding country question grows a third choice: a
-- litigation trainee, on a Malaysian firm's programme. It is recorded as its
-- own column rather than folded into career_stage, because it is not a stage
-- of a career: a trainee may be a student or a graduate, and the firm's
-- programme is a fact about the placement, not the person.
--
-- For now a trainee is shown the same things as any Malaysian learner. The
-- column exists so the app knows who they are before it starts treating them
-- differently, and so a firm reading a roster can tell its trainees from
-- everyone else who happened to pick Malaysia.
--
-- Self-service, like country: the person says which programme they are on,
-- and the firm's confirmations and placement dates remain the firm's to set.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'learner_track') then
    create type learner_track as enum ('general', 'litigation_trainee');
  end if;
end
$$;

alter table public.profiles
  add column if not exists track learner_track not null default 'general';

comment on column public.profiles.track is
  'Which programme they are on. A litigation trainee is on a Malaysian firm''s '
  'programme; everyone else is general. Self-set, like country.';

-- The trainee programme is a Malaysian one, so the track has no meaning
-- against Australian law. Enforced here rather than in the forms alone: a
-- profile can be changed from more than one place, and every one of them
-- should get the same answer.
alter table public.profiles drop constraint if exists profiles_trainee_is_malaysian;
alter table public.profiles add constraint profiles_trainee_is_malaysian
  check (track <> 'litigation_trainee' or country = 'MY');

-- As in 0006: the values arrive in the auth user's metadata, written by the
-- browser, and are narrowed rather than trusted. Choosing the trainee track
-- also settles the country, so the constraint above cannot fail at signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_track learner_track :=
    case when new.raw_user_meta_data ->> 'track' = 'litigation_trainee'
      then 'litigation_trainee' else 'general' end;
begin
  insert into public.profiles (id, email, display_name, country, track)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case
      when chosen_track = 'litigation_trainee' then 'MY'
      when new.raw_user_meta_data ->> 'country' = 'MY' then 'MY'
      else 'AU'
    end::country,
    chosen_track
  )
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


-- >>> 0019_work_board.sql -----------------------------------------

-- =============================================================================
-- The work board: a coach posts work, an intern puts their name on it, hands
-- it in, and the coach marks it
-- =============================================================================
-- Until now a coach could put a video in front of their juniors and nothing
-- else. This is the rest of what supervising actually looks like: here is a
-- piece of work, who is doing it, show me what you did, here is what I think.
--
-- Three tables and a bucket.
--
--   * work_posts is what the coach puts up. Two kinds: a task, which somebody
--     claims and hands in, and a material, which is a reading attached to a
--     session or a homework day and claimed by nobody. A post carries either
--     an uploaded file or a link to a document somewhere the firm already
--     keeps things (Google Drive, Docs), host-checked here and in the app.
--   * work_claims is a name on a piece of work. A post is either for one
--     person, and the first name wins, or for everyone, and each intern does
--     their own. Insert and select only: a name stays put.
--   * work_submissions is what was handed in, append-only for the intern.
--     Handing it in again is a new row. The coach marks a row in place, and a
--     trigger makes sure marking is the only thing that can change on it.
--
-- Every upload carries a declaration that it holds no client-identifying
-- information, checked true at the database and not merely by a tick box.
-- That declaration is how live-matter work is allowed on here at all: the
-- platform is not a document store, and nothing confidential is meant to
-- reach it.
--
-- Who sees what. A post is for litigation trainees unless the coach widens
-- it, and for one country unless the coach says both. The rule lives in one
-- SQL function, work_visible, used by every policy that needs it, so the app
-- never re-decides it in TypeScript.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'work_kind') then
    create type work_kind as enum ('task', 'material');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_scope') then
    create type work_scope as enum ('one', 'everyone');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_verdict') then
    create type work_verdict as enum ('good', 'again');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- What the coach puts up
-- -----------------------------------------------------------------------------
create table if not exists public.work_posts (
  id            uuid primary key default gen_random_uuid(),
  kind          work_kind not null default 'task',
  title         text not null,
  instructions  text not null default '',

  -- One or the other, or neither if the instructions are the whole task. The
  -- file is an object in the 'work' bucket; file_name is what the coach
  -- called it, so nobody is shown a storage path.
  file_path     text,
  file_name     text,
  link_url      text,

  scope         work_scope not null default 'one',
  trainees_only boolean not null default true,
  -- Null means both countries, as coach_sessions.
  country       country,
  -- Information for the intern, not a rule for the database: a late
  -- submission is still a record, and is shown as late.
  due_on        date,

  -- Where it hangs, if anywhere: under a session, or under one of the twenty
  -- homework days. A post can stand on its own on the board as well.
  session_id    uuid references public.coach_sessions (id) on delete set null,
  homework_day  smallint check (homework_day between 1 and 20),

  published     boolean not null default false,
  published_at  timestamptz,
  posted_by     uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Named hosts, as the video allowlist is, checked here and again in the app:
-- a link on a training page is somewhere we are sending a junior, so the
-- question is whether we chose the destination.
alter table public.work_posts
  drop constraint if exists work_posts_link_host;
alter table public.work_posts
  add constraint work_posts_link_host check (
    link_url is null or link_url ~ '^https://(drive|docs)\.google\.com/'
  );

create or replace function public.stamp_work_post()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger work_posts_stamp
  before insert or update on public.work_posts
  for each row execute function public.stamp_work_post();

create or replace trigger work_posts_touch
  before update on public.work_posts
  for each row execute function public.touch_updated_at();

create index if not exists work_posts_board_idx
  on public.work_posts (published, country, trainees_only);

create index if not exists work_posts_session_idx
  on public.work_posts (session_id)
  where session_id is not null;

create index if not exists work_posts_homework_idx
  on public.work_posts (homework_day)
  where homework_day is not null;

-- Whether the person asking can see a post. Security definer so the read of
-- profiles inside a policy does not go back through profiles' own policies,
-- the same reason is_coach() is. Coalesced, so somebody with no profile row
-- sees nothing rather than a null that some caller mistakes for true.
create or replace function public.work_visible(post public.work_posts)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select post.published
        and (post.country is null or post.country = p.country)
        and (not post.trainees_only or p.track = 'litigation_trainee')
       from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- A name on a piece of work
-- -----------------------------------------------------------------------------
create table if not exists public.work_claims (
  id         uuid primary key default gen_random_uuid(),
  -- restrict, not cascade: a coach withdraws a post by unpublishing it, and
  -- no script gets to make an intern's record vanish by deleting the post.
  post_id    uuid not null references public.work_posts (id) on delete restrict,
  user_id    uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists work_claims_post_idx
  on public.work_claims (post_id);

-- First name wins on a post that is for one person. Security definer, and it
-- has to be: run as the intern, the lock would need an update policy on
-- work_posts they do not have, and the count of other people's claims would
-- be hidden by the select policy, so both checks would come back empty
-- exactly when they matter. As the owner, both reads are honest, and the
-- rule holds for the service role too. The lock on the post row is what
-- stops two interns clicking at the same moment from both getting it.
create or replace function public.guard_work_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post public.work_posts%rowtype;
begin
  select * into post from public.work_posts where id = new.post_id for update;
  if not found then
    raise exception 'That piece of work does not exist';
  end if;
  if post.kind <> 'task' then
    raise exception 'A material is for reading, not for claiming';
  end if;
  if post.scope = 'one'
     and exists (select 1 from public.work_claims where post_id = new.post_id) then
    raise exception 'This piece of work already has somebody''s name on it';
  end if;
  -- The date is the record, so it is the database's and never the request's.
  new.claimed_at := now();
  return new;
end;
$$;

create or replace trigger work_claims_guard
  before insert on public.work_claims
  for each row execute function public.guard_work_claim();

-- How many names are on each post, and nothing else. An intern deciding
-- whether a piece of work is still open needs the number and must not see
-- the names, which the select policy on work_claims keeps to their own. A
-- view runs as its owner rather than as the person reading it, so this is
-- the one deliberate window through that policy, and it is a count.
drop view if exists public.work_claim_counts;
create view public.work_claim_counts as
select post_id, count(*)::integer as claims
from public.work_claims
group by post_id;

grant select on public.work_claim_counts to authenticated;

-- -----------------------------------------------------------------------------
-- What was handed in
-- -----------------------------------------------------------------------------
create table if not exists public.work_submissions (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.work_posts (id) on delete restrict,
  user_id        uuid not null references auth.users (id) on delete cascade,
  file_path      text not null,
  file_name      text not null default '',
  note           text not null default '',
  -- Checked true here, not only by the tick box on the form. A row that
  -- says the work was not de-identified cannot exist.
  declared_clean boolean not null check (declared_clean),
  submitted_at   timestamptz not null default now(),

  -- The marking. Nullable until the coach has looked.
  verdict        work_verdict,
  feedback       text not null default '',
  marked_by      uuid references auth.users (id) on delete set null,
  marked_at      timestamptz
);

create index if not exists work_submissions_post_idx
  on public.work_submissions (post_id, user_id, submitted_at desc);

create or replace function public.stamp_work_submission()
returns trigger language plpgsql set search_path = public as $$
begin
  new.submitted_at := now();
  return new;
end;
$$;

create or replace trigger work_submissions_stamp
  before insert on public.work_submissions
  for each row execute function public.stamp_work_submission();

-- A submission is what was handed in. Marking it is the only thing that may
-- change afterwards, and the mark carries its own date, stamped here rather
-- than trusted from the request, as every other date in the firm half is.
create or replace function public.guard_work_mark()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id is distinct from old.id
     or new.post_id is distinct from old.post_id
     or new.user_id is distinct from old.user_id
     or new.file_path is distinct from old.file_path
     or new.file_name is distinct from old.file_name
     or new.note is distinct from old.note
     or new.declared_clean is distinct from old.declared_clean
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'A submission is what was handed in; only the marking may change';
  end if;
  if new.verdict is distinct from old.verdict
     or new.feedback is distinct from old.feedback then
    new.marked_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger work_submissions_guard
  before update on public.work_submissions
  for each row execute function public.guard_work_mark();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.work_posts       enable row level security;
alter table public.work_claims      enable row level security;
alter table public.work_submissions enable row level security;

-- A post is seen by the people it is for, by every coach, and by anybody who
-- already put their name on it. The last clause is what lets a coach
-- unpublish a post to stop new claims without hiding it from somebody who
-- has already handed work in against it.
drop policy if exists work_posts_read on public.work_posts;
create policy work_posts_read on public.work_posts
  for select to authenticated using (
    public.work_visible(work_posts)
    or public.is_coach()
    or exists (
      select 1 from public.work_claims c
      where c.post_id = work_posts.id and c.user_id = auth.uid()
    )
  );

-- And a coach may write them, as with sessions.
drop policy if exists work_posts_write on public.work_posts;
create policy work_posts_write on public.work_posts
  for all to authenticated using (public.is_coach()) with check (public.is_coach());

-- Your own name, on a task you can actually see. Insert and select only, for
-- everybody: nobody, including an administrator, takes a name off.
drop policy if exists work_claims_read on public.work_claims;
create policy work_claims_read on public.work_claims
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

drop policy if exists work_claims_insert_own on public.work_claims;
create policy work_claims_insert_own on public.work_claims
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.work_posts p
      where p.id = work_claims.post_id and p.kind = 'task' and public.work_visible(p)
    )
  );

-- Your own work, on something you put your name on. The intern never edits
-- or removes a submission; a coach may mark it, and the trigger above keeps
-- that to the marking columns.
drop policy if exists work_submissions_read on public.work_submissions;
create policy work_submissions_read on public.work_submissions
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

drop policy if exists work_submissions_insert_own on public.work_submissions;
create policy work_submissions_insert_own on public.work_submissions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.work_claims c
      where c.post_id = work_submissions.post_id and c.user_id = auth.uid()
    )
  );

drop policy if exists work_submissions_mark on public.work_submissions;
create policy work_submissions_mark on public.work_submissions
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- -----------------------------------------------------------------------------
-- The bucket
-- -----------------------------------------------------------------------------
-- Private, unlike avatars. Nobody reads it with a bare URL: the server checks
-- the row through the policies above and hands out a short-lived signed
-- link. Coaches write under posts/, an intern writes under their own folder
-- of submissions/, and only a coach may list or read objects directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work', 'work', false, 20971520, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists work_read_coach on storage.objects;
create policy work_read_coach on storage.objects
  for select to authenticated using (bucket_id = 'work' and public.is_coach());

drop policy if exists work_posts_insert_coach on storage.objects;
create policy work_posts_insert_coach on storage.objects
  for insert to authenticated with check (
    bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach()
  );

drop policy if exists work_posts_update_coach on storage.objects;
create policy work_posts_update_coach on storage.objects
  for update to authenticated
  using (bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach())
  with check (bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach());

drop policy if exists work_posts_delete_coach on storage.objects;
create policy work_posts_delete_coach on storage.objects
  for delete to authenticated using (
    bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach()
  );

drop policy if exists work_submissions_insert_own on storage.objects;
create policy work_submissions_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'work'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
  );


-- >>> 0020_work_memos_messages_slots.sql --------------------------

-- =============================================================================
-- The work board, second pass: a voice memo, a message thread, and how many
-- people may take a task
-- =============================================================================
-- Three things a lawyer asked for after using the board for a day.
--
-- A VOICE MEMO. A lawyer explaining a task out loud for a minute is how they
-- would brief a junior in the corridor, and it is often clearer than what
-- they would type. The recording is a file in the same private bucket as
-- everything else on the board, under the post, signed for by row exactly
-- as the post's document is.
--
-- A MESSAGE THREAD. "Message me for more info" is the sentence under every
-- task. One thread per intern per post: the intern and the coaches, nobody
-- else. Append-only, like everything an intern writes in the firm half: a
-- question asked is a question asked, and nobody edits it afterwards.
--
-- HOW MANY. "For one person" and "for everyone" were the two choices; the
-- lawyer wants "three people" as well. So the choice becomes a number, or
-- nothing for no limit, and the first-name-wins rule becomes the first N
-- names win. The old two-value column goes: two sources of truth for the
-- same rule is how a rule quietly stops holding.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- The memo, and a time estimate the coach confirms
-- -----------------------------------------------------------------------------
alter table public.work_posts add column if not exists memo_path text;
alter table public.work_posts add column if not exists memo_type text;

-- How long the coach expects it to take, in minutes. The app may suggest a
-- number, but what is stored is what the coach saved: an estimate shown to
-- an intern under the coach's name has to be the coach's.
alter table public.work_posts add column if not exists expected_minutes smallint;
alter table public.work_posts
  drop constraint if exists work_posts_expected_minutes_positive;
alter table public.work_posts
  add constraint work_posts_expected_minutes_positive check (
    expected_minutes is null or expected_minutes between 1 and 6000
  );

-- The bucket now takes what a browser records: WebM and Ogg on most
-- browsers, MP4 on Safari, and MP3 and WAV for anybody attaching a file
-- recorded elsewhere.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work', 'work', false, 20971520, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- How many people may take it
-- -----------------------------------------------------------------------------
alter table public.work_posts add column if not exists max_claims smallint;
alter table public.work_posts
  drop constraint if exists work_posts_max_claims_positive;
alter table public.work_posts
  add constraint work_posts_max_claims_positive check (
    max_claims is null or max_claims between 1 and 100
  );

-- Carry the old two-way choice across, then retire it. Guarded so a second
-- paste of the update file, after the column is gone, does nothing.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_posts' and column_name = 'scope'
  ) then
    update public.work_posts set max_claims = 1 where max_claims is null and scope = 'one';
    alter table public.work_posts drop column scope;
  end if;
end $$;

drop type if exists public.work_scope;

-- The first N names win. Everything said about this trigger in 0019 still
-- holds: security definer, because as the intern both the lock and the
-- count would come back empty; a row lock on the post, because that is the
-- only thing that stops two clicks at the same moment from both getting
-- the last place.
create or replace function public.guard_work_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post public.work_posts%rowtype;
  taken integer;
begin
  select * into post from public.work_posts where id = new.post_id for update;
  if not found then
    raise exception 'That piece of work does not exist';
  end if;
  if post.kind <> 'task' then
    raise exception 'A material is for reading, not for claiming';
  end if;
  if post.max_claims is not null then
    select count(*) into taken from public.work_claims where post_id = new.post_id;
    if taken >= post.max_claims then
      raise exception 'This piece of work already has all the names it can take';
    end if;
  end if;
  -- The date is the record, so it is the database's and never the request's.
  new.claimed_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Messages
-- -----------------------------------------------------------------------------
-- A thread is (post, intern). The intern writes into their own; a coach
-- writes into any. Nobody edits or deletes: this is the firm half's rule
-- for anything a person says on the record, and a question to a supervisor
-- is on the record.
create table if not exists public.work_messages (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.work_posts (id) on delete restrict,
  -- Whose thread this is: always the intern, even when a coach is writing.
  thread_user_id uuid not null references auth.users (id) on delete cascade,
  sender_id      uuid not null references auth.users (id) on delete set null,
  body           text not null check (length(body) between 1 and 2000),
  sent_at        timestamptz not null default now()
);

create index if not exists work_messages_thread_idx
  on public.work_messages (post_id, thread_user_id, sent_at);

create or replace function public.stamp_work_message()
returns trigger language plpgsql set search_path = public as $$
begin
  new.sent_at := now();
  return new;
end;
$$;

create or replace trigger work_messages_stamp
  before insert on public.work_messages
  for each row execute function public.stamp_work_message();

alter table public.work_messages enable row level security;

drop policy if exists work_messages_read on public.work_messages;
create policy work_messages_read on public.work_messages
  for select to authenticated using (thread_user_id = auth.uid() or public.is_coach());

-- An intern may write into their own thread on a post they can see. A coach
-- may write into any thread. In both cases the sender is the caller and
-- nobody else: a message under somebody's name is that person's message.
drop policy if exists work_messages_insert on public.work_messages;
create policy work_messages_insert on public.work_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and (
      public.is_coach()
      or (
        thread_user_id = auth.uid()
        and exists (
          select 1 from public.work_posts p
          where p.id = work_messages.post_id
            and (public.work_visible(p) or exists (
              select 1 from public.work_claims c
              where c.post_id = p.id and c.user_id = auth.uid()
            ))
        )
      )
    )
  );


-- >>> 0021_invite_track_and_first_password.sql --------------------

-- =============================================================================
-- Inviting a litigation trainee, and an account made by the administrator
-- =============================================================================
-- Two small things the joining path was missing.
--
-- An invitation now says which programme the person is on, so a litigation
-- trainee arrives as one rather than having to pick it on their first
-- screen. The same rule as profiles: a trainee is Malaysian.
--
-- And an administrator can now make the account outright, with a temporary
-- password they hand over, for a firm that would rather do that than send
-- a link. The account is marked as needing its password changed, and the
-- app puts the choice of a new one in front of that person before anything
-- else, so the password the administrator saw stops working the first time
-- the person signs in. That flag is the person's own to clear, once they
-- have chosen: it is a convenience for them, not a right, and nothing else
-- turns on it.
-- =============================================================================

alter table public.joiner_invitations
  add column if not exists track learner_track not null default 'general';

alter table public.joiner_invitations
  drop constraint if exists joiner_invitations_trainee_is_malaysian;
alter table public.joiner_invitations
  add constraint joiner_invitations_trainee_is_malaysian check (
    track <> 'litigation_trainee' or country = 'MY'
  );

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;


-- >>> 0022_close_direct_writes.sql --------------------------------

-- =============================================================================
-- Closing the doors the app never uses
-- =============================================================================
-- An audit read every policy against what the app actually does, and found
-- places where the database allowed more than any page ever asks for. None
-- of them is reachable by pressing a button. All of them are reachable by
-- somebody who takes their own sign-in token to the public API, and the
-- record a firm relies on is only as good as the least guarded way in.
--
-- 1. A learner's training record was theirs to write. Sessions, mastery,
--    review dates, streaks and diagnostic results all had "for all"
--    policies, and attempts had an insert policy, although every write the
--    app makes to them goes through the server with the service role. So a
--    learner could set every mastery score to 100, rewrite the diagnostic a
--    firm compares against, or add a question of their choosing to their own
--    session and be told its answer. Learners now read these and nothing
--    else. The server writes them, as it always has.
--
-- 2. A piece of work could be handed in already marked. The insert policy
--    checked who and which post, not the marking columns, so an intern could
--    submit with verdict 'good' and a coach's name on it. Marking columns are
--    now cleared on the way in, and a mark records the person who made it
--    and the moment they made it, never a value from the request. The file
--    path must be the intern's own folder for that post, so a row cannot
--    name somebody else's file for the server to sign a link to.
--
-- 3. A firm policy could be reworded after people had acknowledged it. The
--    acknowledgement is pinned to a version, and that only means something
--    if the version's words cannot change. The wording of a version is now
--    frozen; the app only ever moves the "current" marker, and a new wording
--    is a new version, which puts it back in front of everyone.
--
-- 4. The firm-half records were insert and select only by policy alone,
--    while the API roles still held the table rights to update and delete.
--    Those rights are withdrawn, and an update is refused outright, for
--    everybody. A delete is still possible for the service role, so that
--    removing a person's account removes what belongs to them.
--
-- 5. Smaller ones: a profile could be created with staff flags set, where
--    the signup trigger had not already made one; the count of names on each
--    piece of work was readable without signing in; and the name on a
--    published session or a posted piece of work came from the request when
--    written directly.
--
-- 6. "Put everything back in front of learners" would have published the
--    whole unchecked Malaysian bank; it now puts back only what a person
--    withdrew. See section 6 below.
--
-- 7. An administrator could sign off a version they wrote themselves, which
--    is the one thing the split between the two staff roles exists to stop.
--
-- 8. The bucket let anybody store files in their own folder for any post; a
--    file is now stored only for work they have put their name on.
--
-- 9. The AI note on an answer is asked for once and kept, rather than being
--    a paid call to the model on every request.
-- =============================================================================

-- 1. The training record is the server's to write ---------------------------

drop policy if exists sessions_own on public.training_sessions;
drop policy if exists sessions_select_own on public.training_sessions;
create policy sessions_select_own on public.training_sessions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tsq_own on public.training_session_questions;
drop policy if exists tsq_select_own on public.training_session_questions;
create policy tsq_select_own on public.training_session_questions
  for select to authenticated
  using (exists (select 1 from public.training_sessions s
                 where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists attempts_insert_own on public.user_question_attempts;

drop policy if exists concept_mastery_own on public.user_concept_mastery;
drop policy if exists concept_mastery_select_own on public.user_concept_mastery;
create policy concept_mastery_select_own on public.user_concept_mastery
  for select to authenticated using (user_id = auth.uid());

drop policy if exists skill_mastery_own on public.user_skill_mastery;
drop policy if exists skill_mastery_select_own on public.user_skill_mastery;
create policy skill_mastery_select_own on public.user_skill_mastery
  for select to authenticated using (user_id = auth.uid());

drop policy if exists review_schedule_own on public.review_schedule;
drop policy if exists review_schedule_select_own on public.review_schedule;
create policy review_schedule_select_own on public.review_schedule
  for select to authenticated using (user_id = auth.uid());

drop policy if exists diagnostic_results_own on public.diagnostic_results;
drop policy if exists diagnostic_results_select_own on public.diagnostic_results;
create policy diagnostic_results_select_own on public.diagnostic_results
  for select to authenticated using (user_id = auth.uid());

drop policy if exists streaks_own on public.user_streaks;
drop policy if exists streaks_select_own on public.user_streaks;
create policy streaks_select_own on public.user_streaks
  for select to authenticated using (user_id = auth.uid());

-- 2. Work is handed in unmarked, and a mark is whoever made it ---------------

create or replace function public.stamp_work_submission()
returns trigger language plpgsql set search_path = public as $$
begin
  new.submitted_at := now();
  new.verdict := null;
  new.feedback := '';
  new.marked_by := null;
  new.marked_at := null;
  return new;
end;
$$;

create or replace function public.guard_work_mark()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id is distinct from old.id
     or new.post_id is distinct from old.post_id
     or new.user_id is distinct from old.user_id
     or new.file_path is distinct from old.file_path
     or new.file_name is distinct from old.file_name
     or new.note is distinct from old.note
     or new.declared_clean is distinct from old.declared_clean
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'A submission is what was handed in; only the marking may change';
  end if;
  if new.verdict is distinct from old.verdict
     or new.feedback is distinct from old.feedback then
    new.marked_at := now();
    -- Through the API the marker is the person signed in, whatever the
    -- request said. The server marks with the service role, where there is
    -- no signed-in person, and names the coach from their session itself.
    if auth.uid() is not null then
      new.marked_by := auth.uid();
    end if;
  else
    -- Nothing about the mark changed, so neither may its name or its date.
    new.marked_at := old.marked_at;
    new.marked_by := old.marked_by;
  end if;
  return new;
end;
$$;

-- Not valid: the rows already there were all written by the app, which
-- builds exactly this path, and the check applies to every row from here.
alter table public.work_submissions
  drop constraint if exists work_submissions_own_folder;
alter table public.work_submissions
  add constraint work_submissions_own_folder check (
    file_path like 'submissions/' || user_id::text || '/' || post_id::text || '/%'
  ) not valid;

-- 3. The words of a firm policy version are fixed -----------------------------

create or replace function public.freeze_firm_module_version()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.body is distinct from old.body
     or new.version is distinct from old.version
     or new.firm_module_id is distinct from old.firm_module_id
     or new.created_at is distinct from old.created_at
     or new.created_by is distinct from old.created_by then
    raise exception 'A published version is what people acknowledged; publish a new version instead';
  end if;
  return new;
end;
$$;

create or replace trigger firm_module_versions_freeze
  before update on public.firm_module_versions
  for each row execute function public.freeze_firm_module_version();

-- 4. Firm-half records: insert and select, for everybody ----------------------

-- The one change let through is a column becoming empty, which is what a
-- foreign key does when the account it names is removed. Anything else is a
-- change to what was recorded.
create or replace function public.block_record_update()
returns trigger language plpgsql set search_path = public as $$
declare
  was jsonb := to_jsonb(old);
  now_is jsonb := to_jsonb(new);
  k text;
begin
  for k in select jsonb_object_keys(was) loop
    if now_is -> k is distinct from was -> k and now_is -> k <> 'null'::jsonb then
      raise exception '% is a record: add a correction, do not change what was recorded',
        tg_table_name;
    end if;
  end loop;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'firm_module_acknowledgements',
    'firm_step_declarations',
    'firm_step_confirmations',
    'onboarding_decisions',
    'homework_declarations',
    'work_claims',
    'work_messages'
  ] loop
    execute format('revoke update, delete, truncate on public.%I from anon, authenticated', t);
    execute format(
      'create or replace trigger %I before update on public.%I for each row execute function public.block_record_update()',
      t || '_no_update', t
    );
  end loop;
end
$$;

revoke delete, truncate on public.work_submissions from anon, authenticated;
revoke update, delete, truncate on public.user_question_attempts from anon, authenticated;

-- 5. The smaller ones ---------------------------------------------------------

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and not is_admin and not coalesce(is_coach, false));

revoke all on public.work_claim_counts from anon;

create or replace function public.stamp_coach_session()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
    if auth.uid() is not null then
      new.published_by := auth.uid();
    end if;
  elsif not new.published then
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_work_post_author()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null then
    new.posted_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace trigger work_posts_author
  before insert on public.work_posts
  for each row execute function public.stamp_work_post_author();

-- 6. Withdrawn by a person, not merely unpublished ----------------------------
-- "Put everything back in front of learners" undoes a bulk withdrawal. It
-- found what to put back by status alone, and the Malaysian bank arrives with
-- that same status because it never publishes itself, so on a new install the
-- button would have published every unchecked Malaysian question at once.
-- Withdrawing now stamps the moment, and only stamped content goes back.
alter table public.questions add column if not exists withdrawn_at timestamptz;
alter table public.daily_facts add column if not exists withdrawn_at timestamptz;

-- 7. Nobody signs off their own writing ----------------------------------------
-- The server refuses it; this is the same rule where no request can reach
-- round it. Not valid, so an existing row is not judged by a rule it predates.
alter table public.question_versions
  drop constraint if exists question_versions_not_self_verified;
alter table public.question_versions
  add constraint question_versions_not_self_verified check (
    verified_by is null or created_by is null or verified_by <> created_by
  ) not valid;

alter table public.daily_facts
  drop constraint if exists daily_facts_not_self_verified;
alter table public.daily_facts
  add constraint daily_facts_not_self_verified check (
    verified_by is null or created_by is null or verified_by <> created_by
  ) not valid;

-- 8. A file is handed in only for work with your name on it --------------------
-- The folder check alone let anybody signed in store files under their own
-- name for any post, or none, up to the bucket's limit, as often as they
-- liked. The third folder is the post, and it has to be one they claimed.
drop policy if exists work_submissions_insert_own on storage.objects;
create policy work_submissions_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'work'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.work_claims c
      where c.user_id = auth.uid()
        and c.post_id::text = (storage.foldername(name))[3]
    )
  );

-- 9. One AI note per answer ------------------------------------------------------
-- Asking for the coach's note on an answered question was a fresh paid call to
-- the model every time, with nothing to stop it being asked for in a loop. The
-- note is now kept against the answer and handed back on a second request.
alter table public.training_session_questions
  add column if not exists coach_note text;
alter table public.training_session_questions
  add column if not exists coach_note_at timestamptz;


-- >>> 0023_trainee_approval.sql -----------------------------------

-- =============================================================================
-- A trainee is a trainee once somebody at the firm says so
-- =============================================================================
-- The trainee sign-up page is public, on purpose: the owner wants a trainee
-- to be able to find it and join without waiting for a link. But what being
-- a trainee opens (the work coaches post for trainees, the files and voice
-- memos on it, and a place on work that only a few people may take) was
-- decided by a field the person set about themselves. Anybody who found the
-- page could read the firm's trainee work and take the places on it.
--
-- So the programme is now two things: saying you are on it, which anybody
-- may, and a coach or administrator confirming it, which only they may. The
-- confirmation records who and when. Until it exists, trainee work stays
-- out of sight and everything else in the app works as normal.
--
-- Joining by invitation, or through an account an administrator made, is
-- confirmed on the way in: the firm chose the programme when it invited
-- them. Trainees who already joined that way are confirmed here from their
-- invitation. Anybody who signed themselves up before this is not, and a
-- coach confirms them in a click; that is the point of the change.
--
-- A person changing their own programme loses the confirmation, because it
-- was a statement about the programme they were on.
-- =============================================================================

alter table public.profiles
  add column if not exists trainee_approved_at timestamptz;
alter table public.profiles
  add column if not exists trainee_approved_by uuid references auth.users (id) on delete set null;

update public.profiles p
set trainee_approved_at = i.accepted_at,
    trainee_approved_by = i.invited_by
from public.joiner_invitations i
where i.accepted_by = p.id
  and i.track = 'litigation_trainee'
  and i.accepted_at is not null
  and p.track = 'litigation_trainee'
  and p.trainee_approved_at is null;

create or replace function public.guard_trainee_approval()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Staff, and the server acting for them, may confirm. Even they cannot
  -- leave a confirmation on somebody who is not on the programme.
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_coach() then
    if new.track is distinct from 'litigation_trainee' then
      new.trainee_approved_at := null;
      new.trainee_approved_by := null;
    end if;
    return new;
  end if;

  -- Anybody else: never set it themselves, and lose it if they change
  -- programme.
  if tg_op = 'INSERT' or new.track is distinct from old.track then
    new.trainee_approved_at := null;
    new.trainee_approved_by := null;
  else
    new.trainee_approved_at := old.trainee_approved_at;
    new.trainee_approved_by := old.trainee_approved_by;
  end if;
  return new;
end;
$$;

create or replace trigger profiles_guard_trainee_approval
  before insert or update on public.profiles
  for each row execute function public.guard_trainee_approval();

-- Trainee-only work is for confirmed trainees.
create or replace function public.work_visible(post public.work_posts)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select post.published
        and (post.country is null or post.country = p.country)
        and (not post.trainees_only
             or (p.track = 'litigation_trainee' and p.trainee_approved_at is not null))
       from public.profiles p where p.id = auth.uid()),
    false
  );
$$;


-- >>> 0024_second_audit.sql ---------------------------------------

-- =============================================================================
-- What a second audit found
-- =============================================================================
-- A second pass over the schema, after 0022 and 0023, found one thing 0022
-- itself got wrong and a handful of smaller gaps.
--
-- 1. The rule that nobody signs off their own writing was added "not valid",
--    to leave older rows alone. Postgres checks such a rule again whenever a
--    row changes, so any item somebody had already signed off themselves
--    could no longer be changed at all: not withdrawn, not flagged, not
--    replaced by a new version. Those sign-offs are cleared here, because
--    under the rule they were never sign-offs, and the rule is then checked
--    against every row. The items go back to "needs review" and show in the
--    queue as such. Nothing about what learners can see changes here.
--
-- 2. A hand-in's file path could climb out of its folder with "..", which
--    the link-signing on the server then followed to somebody else's file.
--    The path must now be exactly the shape the app writes.
--
-- 3. The name and date on a published session or a posted piece of work
--    could be rewritten after the fact, and a certification entry could be
--    logged under another coach's name, when written directly.
--
-- 4. A learner could rewrite the email address on their own profile, which
--    is how staff pages identify people, so a stranger could pose as the
--    trainee a coach was expecting and be confirmed. Email and the date the
--    account was made are now the server's, along with the placement dates
--    and "must change password" on a newly made profile.
--
-- 5. A staff confirmation of a trainee made directly now records the person
--    who made it and the moment, not values from the request.
--
-- 6. An acknowledgement could be recorded against a version that is not the
--    current one of a published policy.
--
-- 7. The count of names on each piece of work showed posts the reader could
--    not otherwise see.
--
-- 8. An administrator could confirm their own checklist item, or clear
--    themselves, by writing directly; the app refused it, the database now
--    does too.
--
-- 9. Somebody who took a place on trainee work before 0023, or who has been
--    moved off the programme since, kept seeing that work and its files.
-- =============================================================================

-- 1. Self sign-offs -------------------------------------------------------------

update public.question_versions
set verification_status = 'requires_review',
    verified_by = null,
    verified_at = null,
    review_due_on = null
where verified_by is not null
  and created_by is not null
  and verified_by = created_by;

update public.daily_facts
set verification_status = 'requires_review',
    verified_by = null,
    verified_at = null,
    review_due_on = null
where verified_by is not null
  and created_by is not null
  and verified_by = created_by;

do $$
begin
  alter table public.question_versions validate constraint question_versions_not_self_verified;
  alter table public.daily_facts validate constraint daily_facts_not_self_verified;
exception when others then
  raise notice 'self sign-off rule left unvalidated: %', sqlerrm;
end
$$;

-- 2. A hand-in's file is where the app put it ------------------------------------

alter table public.work_submissions
  drop constraint if exists work_submissions_own_folder;
alter table public.work_submissions
  add constraint work_submissions_own_folder check (
    file_path ~ ('^submissions/' || user_id::text || '/' || post_id::text || '/[0-9]+\.[a-z0-9]+$')
  ) not valid;

do $$
begin
  alter table public.work_submissions validate constraint work_submissions_own_folder;
exception when others then
  raise notice 'hand-in path rule left unvalidated: %', sqlerrm;
end
$$;

-- 3. Names and dates on what coaches publish -----------------------------------

create or replace function public.stamp_coach_session()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
    if auth.uid() is not null then
      new.published_by := auth.uid();
    end if;
  elsif new.published then
    -- Still published: who published it, and when, stay as they were.
    new.published_at := old.published_at;
    new.published_by := old.published_by;
  else
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_work_post()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif new.published then
    new.published_at := old.published_at;
  else
    new.published_at := null;
  end if;
  if tg_op = 'UPDATE' then
    new.posted_by := old.posted_by;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_created_by()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace trigger certification_trainees_author
  before insert on public.certification_trainees
  for each row execute function public.stamp_created_by();

create or replace trigger certification_entries_author
  before insert on public.certification_entries
  for each row execute function public.stamp_created_by();

-- 4. What a person may not change about their own profile ------------------------

create or replace function public.guard_profile_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Only reachable where the signup trigger did not make the row. Nothing
    -- the firm decides may arrive with it.
    new.starts_on := null;
    new.ends_on := null;
    new.must_change_password := false;
    new.diagnostic_completed_at := null;
    new.created_at := now();
    return new;
  end if;

  new.email := old.email;
  new.created_at := old.created_at;
  -- Set by the server when the diagnostic is finished, not by the learner.
  new.diagnostic_completed_at := old.diagnostic_completed_at;
  -- A person may clear "choose your own password", never set it.
  if new.must_change_password and not old.must_change_password then
    new.must_change_password := false;
  end if;
  return new;
end;
$$;

create or replace trigger profiles_guard_identity
  before insert or update on public.profiles
  for each row execute function public.guard_profile_identity();

-- 5. A trainee confirmation carries who made it ----------------------------------

create or replace function public.guard_trainee_approval()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_coach() then
    if new.track is distinct from 'litigation_trainee' then
      new.trainee_approved_at := null;
      new.trainee_approved_by := null;
    elsif auth.uid() is not null
          and new.trainee_approved_at is not null
          and (tg_op = 'INSERT' or old.trainee_approved_at is null) then
      -- A member of staff confirming directly: their name, now.
      new.trainee_approved_at := now();
      new.trainee_approved_by := auth.uid();
    elsif auth.uid() is not null and tg_op = 'UPDATE' and new.trainee_approved_at is not null then
      new.trainee_approved_at := old.trainee_approved_at;
      new.trainee_approved_by := old.trainee_approved_by;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' or new.track is distinct from old.track then
    new.trainee_approved_at := null;
    new.trainee_approved_by := null;
  else
    new.trainee_approved_at := old.trainee_approved_at;
    new.trainee_approved_by := old.trainee_approved_by;
  end if;
  return new;
end;
$$;

-- 6. Acknowledging the policy that is actually in force --------------------------

drop policy if exists firm_ack_insert_own on public.firm_module_acknowledgements;
create policy firm_ack_insert_own on public.firm_module_acknowledgements
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.firm_module_versions v
      join public.firm_modules m on m.id = v.firm_module_id
      where v.id = firm_module_version_id
        and v.is_current
        and m.published
    )
  );

-- 7. Counts only for work the reader can see ------------------------------------

create or replace view public.work_claim_counts as
select c.post_id, count(*)::integer as claims
from public.work_claims c
where exists (
  select 1 from public.work_posts p
  where p.id = c.post_id
    and (public.work_visible(p) or public.is_coach()
         or exists (select 1 from public.work_claims mine
                    where mine.post_id = p.id and mine.user_id = auth.uid()))
)
group by c.post_id;

revoke all on public.work_claim_counts from anon;
grant select on public.work_claim_counts to authenticated;

-- 8. Nobody confirms or clears themselves, in the database too -------------------
-- The app already refuses it. This is the same rule where a direct write
-- cannot reach round it.

drop policy if exists firm_step_confirmations_insert on public.firm_step_confirmations;
create policy firm_step_confirmations_insert on public.firm_step_confirmations
  for insert to authenticated
  with check (public.is_admin() and confirmed_by = auth.uid() and user_id <> auth.uid());

drop policy if exists onboarding_decisions_insert on public.onboarding_decisions;
create policy onboarding_decisions_insert on public.onboarding_decisions
  for insert to authenticated
  with check (public.is_admin() and decided_by = auth.uid() and user_id <> auth.uid());

-- 9. Keeping a trainee post you took needs you to still be a trainee -------------
-- Somebody who put their name on a post keeps seeing it after it is
-- unpublished, deliberately. For a post that is for trainees, that now also
-- needs them to be a confirmed trainee, so anybody who took a place before
-- 0023, or who has since been moved off the programme, loses it.

create or replace function public.is_confirmed_trainee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select track = 'litigation_trainee' and trainee_approved_at is not null
     from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists work_posts_read on public.work_posts;
create policy work_posts_read on public.work_posts
  for select to authenticated using (
    public.work_visible(work_posts)
    or public.is_coach()
    or (
      exists (
        select 1 from public.work_claims c
        where c.post_id = work_posts.id and c.user_id = auth.uid()
      )
      and (not work_posts.trainees_only or public.is_confirmed_trainee())
    )
  );

drop policy if exists work_messages_insert on public.work_messages;
create policy work_messages_insert on public.work_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and (
      public.is_coach()
      or (
        thread_user_id = auth.uid()
        and exists (
          select 1 from public.work_posts p
          where p.id = work_messages.post_id
            and (public.work_visible(p) or (
              exists (
                select 1 from public.work_claims c
                where c.post_id = p.id and c.user_id = auth.uid()
              )
              and (not p.trainees_only or public.is_confirmed_trainee())
            ))
        )
      )
    )
  );


-- >>> 0025_leaderboard.sql ----------------------------------------

-- =============================================================================
-- The firm's weekly leaderboard
-- =============================================================================
-- XP this week, among the learners of one deployment, first names only.
--
-- Off until an administrator turns it on. Some firms want it and some
-- trainees hate it, so it is the firm's call, made in one place, and a
-- learner who would rather not appear can take themselves off it without
-- asking anybody. Staff never appear: a coach on the table would be the
-- wrong kind of competition.
--
-- The table is read through one function that runs as its owner, because
-- the alternative is a policy letting every learner read every other
-- learner's XP ledger and profile, and the function gives back the only
-- two things a leaderboard needs: a first name and a number. It gives back
-- nothing at all while the setting is off, whoever asks.
-- =============================================================================

create table if not exists public.firm_settings (
  -- One row. The key is the boolean true, and the check keeps it that way.
  id                  boolean primary key default true check (id),
  leaderboard_enabled boolean not null default false,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null
);

insert into public.firm_settings (id) values (true) on conflict (id) do nothing;

alter table public.firm_settings enable row level security;

-- Everyone signed in may read the flag, and only the flag: who switched it
-- and when is the firm's business, not every learner's.
revoke select on public.firm_settings from anon, authenticated;
grant select (id, leaderboard_enabled) on public.firm_settings to authenticated;

drop policy if exists firm_settings_read on public.firm_settings;
create policy firm_settings_read on public.firm_settings
  for select to authenticated using (true);
drop policy if exists firm_settings_admin on public.firm_settings;
create policy firm_settings_admin on public.firm_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.stamp_firm_settings()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace trigger firm_settings_stamp
  before update on public.firm_settings
  for each row execute function public.stamp_firm_settings();

alter table public.profiles
  add column if not exists leaderboard_opt_out boolean not null default false;

create or replace function public.weekly_leaderboard()
returns table (place integer, first_name text, xp integer, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      p.id,
      -- A first name, or "Someone". A display name that is really the
      -- email's local part (what sign-up fills in when no name is given)
      -- is not a first name and would put the email on every dashboard.
      case
        when nullif(trim(p.display_name), '') is null then 'Someone'
        when p.display_name like '%@%' then 'Someone'
        when lower(trim(p.display_name)) = lower(split_part(coalesce(p.email, ''), '@', 1)) then 'Someone'
        else split_part(trim(p.display_name), ' ', 1)
      end as first_name,
      coalesce(sum(x.amount), 0)::integer as xp
    from public.profiles p
    left join public.xp_events x
      on x.user_id = p.id
     and x.created_at >= now() - interval '7 days'
    where not p.is_admin
      and not coalesce(p.is_coach, false)
      and not p.leaderboard_opt_out
    group by p.id, p.display_name
  ),
  ranked as (
    select id, first_name, xp,
           rank() over (order by xp desc, first_name asc, id asc)::integer as place
    from totals
    where xp > 0
  )
  select place, first_name, xp, id = auth.uid() as is_me
  from ranked
  where auth.uid() is not null
    and (select leaderboard_enabled from public.firm_settings where id)
    and (place <= 10 or id = auth.uid())
  order by place;
$$;

revoke all on function public.weekly_leaderboard() from public;
revoke all on function public.weekly_leaderboard() from anon;
grant execute on function public.weekly_leaderboard() to authenticated;


-- >>> 0026_trainee_videos_and_comments.sql ------------------------

-- =============================================================================
-- Trainee-only videos, and comments on the work board
-- =============================================================================
-- Two things the owner asked for once the trainee programme had a start date.
--
-- TRAINEE-ONLY VIDEOS. The coach posts a short video every morning of the
-- programme about what the trainees are doing that day. It is for them:
-- an intern on the general academy, or a student who signed up from the
-- home page, should not see it. Until now a published session was shown to
-- everybody in its country. A session can now be marked for confirmed
-- trainees only, and that is decided here, in the read policy, not by a
-- page remembering to filter. Existing sessions keep the default, which is
-- everybody, so nothing already published disappears.
--
-- COMMENTS AND WHO IS ON IT. A lawyer posts a piece of work for the
-- trainees or for everybody. People put their names on it (that already
-- exists, 0019), and now everybody who can see the post sees who is on it
-- and can say something underneath. This is different from the message
-- thread (0020), which is private between one intern and the coaches.
-- Comments are public to the post's readers.
--
-- Names. Other people are shown by first name only, through two security
-- definer functions, because profiles are not readable across learners and
-- should not become so. The first-name rule is the leaderboard's (0025): a
-- display name that is empty, has an @ in it, or is really the email's
-- local part comes back as "Someone", so nobody's inbox lands on a page the
-- whole cohort reads.
--
-- Comments are on the record. Insert and select only, for everybody: a
-- comment is not edited into something else afterwards and is not deleted
-- to make a thread read differently. The date is the database's.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Trainee-only sessions
-- -----------------------------------------------------------------------------
alter table public.coach_sessions
  add column if not exists trainees_only boolean not null default false;

-- A learner sees what is published and meant for them. A trainee-only
-- session needs a confirmed trainee: saying you are a trainee at sign-up
-- opens nothing until a coach confirms it (0023). Coaches see everything,
-- drafts included, as before.
drop policy if exists coach_sessions_read on public.coach_sessions;
create policy coach_sessions_read on public.coach_sessions
  for select to authenticated using (
    (published and (not trainees_only or public.is_confirmed_trainee()))
    or public.is_coach()
  );

-- -----------------------------------------------------------------------------
-- 2. Who may see a post, as one function
-- -----------------------------------------------------------------------------
-- The same three ways in as the read policy on work_posts (0024): it is
-- meant for them, they are staff, or they already put their name on it and
-- still qualify. Security definer, so a comment policy can ask the question
-- without reading work_posts and work_claims through the caller's own RLS.
create or replace function public.can_see_work_post(post uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.work_visible(p)
         or public.is_coach()
         or (
           exists (
             select 1 from public.work_claims c
             where c.post_id = p.id and c.user_id = auth.uid()
           )
           and (not p.trainees_only or public.is_confirmed_trainee())
         )
       from public.work_posts p where p.id = post),
    false
  );
$$;

revoke all on function public.can_see_work_post(uuid) from public;
revoke all on function public.can_see_work_post(uuid) from anon;
grant execute on function public.can_see_work_post(uuid) to authenticated;

-- The first name a cohort sees, or "Someone". One definition, used by both
-- functions below.
create or replace function public.shown_first_name(display_name text, email text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when nullif(trim(display_name), '') is null then 'Someone'
    when display_name like '%@%' then 'Someone'
    when lower(trim(display_name)) = lower(split_part(coalesce(email, ''), '@', 1)) then 'Someone'
    else split_part(trim(display_name), ' ', 1)
  end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Comments
-- -----------------------------------------------------------------------------
create table if not exists public.work_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.work_posts (id) on delete restrict,
  author_id  uuid references auth.users (id) on delete set null,
  body       text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists work_comments_post_idx
  on public.work_comments (post_id, created_at);

-- The date is the record, so it is the database's and never the request's.
create or replace function public.stamp_work_comment()
returns trigger language plpgsql set search_path = public as $$
begin
  new.created_at := now();
  return new;
end;
$$;

create or replace trigger work_comments_stamp
  before insert on public.work_comments
  for each row execute function public.stamp_work_comment();

alter table public.work_comments enable row level security;

drop policy if exists work_comments_read on public.work_comments;
create policy work_comments_read on public.work_comments
  for select to authenticated using (public.can_see_work_post(post_id));

-- Anybody who can see a published post may say something under it, as
-- themselves. Staff may comment on a draft too, to leave a note for each
-- other before it goes up. No update and no delete policy, for anybody.
drop policy if exists work_comments_insert on public.work_comments;
create policy work_comments_insert on public.work_comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and (
      public.is_coach()
      or exists (
        select 1 from public.work_posts p
        where p.id = work_comments.post_id
          and p.published
          and public.can_see_work_post(p.id)
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 4. Names, for people who can see the post
-- -----------------------------------------------------------------------------
-- Who has their name on each post the caller can see. First names only,
-- and no ids: what the page needs is "Aisyah, Wei and you", not a handle on
-- another person's account.
create or replace function public.work_board_people()
returns table (post_id uuid, first_name text, is_me boolean, claimed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.post_id,
         public.shown_first_name(p.display_name, p.email),
         c.user_id = auth.uid(),
         c.claimed_at
  from public.work_claims c
  join public.profiles p on p.id = c.user_id
  where auth.uid() is not null
    and public.can_see_work_post(c.post_id)
  order by c.post_id, c.claimed_at;
$$;

revoke all on function public.work_board_people() from public;
revoke all on function public.work_board_people() from anon;
grant execute on function public.work_board_people() to authenticated;

-- The comments under one post, oldest first, with who wrote each. Staff
-- are marked so a lawyer's answer stands out from the cohort's.
create or replace function public.work_post_comments(post uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  first_name text,
  is_me boolean,
  is_staff boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select w.id,
         w.body,
         w.created_at,
         coalesce(public.shown_first_name(p.display_name, p.email), 'Someone'),
         w.author_id is not null and w.author_id = auth.uid(),
         coalesce(p.is_admin or coalesce(p.is_coach, false), false)
  from public.work_comments w
  left join public.profiles p on p.id = w.author_id
  where w.post_id = post
    and auth.uid() is not null
    and public.can_see_work_post(post)
  order by w.created_at, w.id;
$$;

revoke all on function public.work_post_comments(uuid) from public;
revoke all on function public.work_post_comments(uuid) from anon;
grant execute on function public.work_post_comments(uuid) to authenticated;


-- >>> 0027_matters.sql --------------------------------------------

-- =============================================================================
-- Matters: a problem first, then how a lawyer would approach it
-- =============================================================================
-- A matter is a short practice file. The learner gets the facts and a time
-- limit, and works four tasks: identify the procedure, draft a short advice,
-- record a spoken explanation of up to three minutes, and answer five
-- follow-up questions asked about their own draft. Once they hand it in they
-- see the lawyer's approach, and a coach may mark it Good or Needs another go.
--
-- A matter is legal content, so it follows the questions' rules:
--
--   * An administrator writes it. A coach signs it off. Nobody signs off what
--     they wrote, and that is a constraint here, not only a check in the app.
--   * Nothing is published until it is signed off, and changing what a
--     matter says clears the sign-off and takes it down again, so a signed
--     record always describes the words that were actually checked.
--   * The lawyer's approach is never readable by a learner before they have
--     handed in their own attempt. Column grants keep it out of the table's
--     public face; one security definer function hands it over, and only for
--     an attempt the caller owns and has submitted.
--
-- An attempt keeps a copy of the matter as it stood when it was started, so
-- a later edit never changes what somebody was actually asked. What they
-- hand in is frozen once submitted: marking can add a verdict and a
-- paragraph, and nothing else.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Matters
-- -----------------------------------------------------------------------------
create table if not exists public.matters (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  number             smallint not null default 1 check (number between 1 and 999),
  title              text not null check (length(title) between 3 and 200),
  country            country not null default 'MY',
  area               text not null default '' check (length(area) <= 80),
  brief              text not null check (length(brief) between 20 and 6000),
  time_limit_minutes smallint not null default 45 check (time_limit_minutes between 5 and 240),
  procedure_prompt   text not null default 'Identify the applicable procedure, and the rule or provision it comes from.',
  draft_prompt       text not null default 'Draft a short advice to the client: what they should do, by when, and why.',
  speak_prompt       text not null default 'Explain your advice out loud, as you would to the client, in no more than three minutes.',
  model_answer       text not null default '' check (length(model_answer) <= 12000),
  sources            text not null default '' check (length(sources) <= 2000),
  published          boolean not null default false,
  published_at       timestamptz,
  verified_by        uuid
                     references auth.users (id) on delete set null,
  verified_at        timestamptz,
  review_flagged     boolean not null default false,
  review_note        text not null default '' check (length(review_note) <= 2000),
  reviewed_by        uuid
                     references auth.users (id) on delete set null,
  reviewed_at        timestamptz,
  created_by         uuid
                     references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Nobody signs off their own writing.
alter table public.matters drop constraint if exists matters_not_self_verified;
alter table public.matters
  add constraint matters_not_self_verified check (
    verified_by is null or created_by is null or verified_by <> created_by
  );

-- Nothing reaches a learner unchecked, and nothing flagged stays up.
alter table public.matters drop constraint if exists matters_published_only_when_verified;
alter table public.matters
  add constraint matters_published_only_when_verified check (
    not published or (verified_by is not null and not review_flagged)
  );

create or replace trigger matters_touch
  before update on public.matters
  for each row execute function public.touch_updated_at();

-- Changing what a matter says clears its sign-off and takes it down. The
-- sign-off was a statement about particular words; it does not carry over to
-- new ones. Publishing stamps its own date.
create or replace function public.guard_matter()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (
       new.title is distinct from old.title
    or new.country is distinct from old.country
    or new.area is distinct from old.area
    or new.brief is distinct from old.brief
    or new.time_limit_minutes is distinct from old.time_limit_minutes
    or new.procedure_prompt is distinct from old.procedure_prompt
    or new.draft_prompt is distinct from old.draft_prompt
    or new.speak_prompt is distinct from old.speak_prompt
    or new.model_answer is distinct from old.model_answer
    or new.sources is distinct from old.sources
  ) then
    new.verified_by := null;
    new.verified_at := null;
    new.published := false;
  end if;

  -- A flag takes it down, as a flag on a question does.
  if new.review_flagged then
    new.published := false;
  end if;

  if new.verified_by is not null
     and (tg_op = 'INSERT' or new.verified_by is distinct from old.verified_by) then
    new.verified_at := now();
  end if;

  if new.published and (tg_op = 'INSERT' or not old.published) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger matters_guard
  before insert or update on public.matters
  for each row execute function public.guard_matter();

alter table public.matters enable row level security;

-- A learner sees published matters for their own country; staff see all.
-- Writes go through the server, after the role is checked, so there is no
-- write policy for anybody.
drop policy if exists matters_read on public.matters;
create policy matters_read on public.matters
  for select to authenticated using (
    public.is_coach()
    or (
      published
      and country = (select p.country from public.profiles p where p.id = auth.uid())
    )
  );

-- The lawyer's approach is not part of what a learner can select. Every
-- other column is.
revoke select on public.matters from anon, authenticated;
grant select (
  id, slug, number, title, country, area, brief, time_limit_minutes,
  procedure_prompt, draft_prompt, speak_prompt, published, published_at,
  verified_at, created_at, updated_at
) on public.matters to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Attempts
-- -----------------------------------------------------------------------------
create table if not exists public.matter_attempts (
  id                 uuid primary key default gen_random_uuid(),
  matter_id          uuid not null
                     references public.matters (id) on delete restrict,
  user_id            uuid not null
                     references auth.users (id) on delete cascade,
  started_at         timestamptz not null default now(),
  deadline_at        timestamptz not null default now(),
  snapshot           jsonb not null default '{}'::jsonb,
  procedure_answer   text not null default '' check (length(procedure_answer) <= 4000),
  draft_answer       text not null default '' check (length(draft_answer) <= 12000),
  recording_path     text,
  recording_seconds  smallint check (recording_seconds is null or recording_seconds between 1 and 200),
  followup_questions jsonb not null default '[]'::jsonb,
  followup_answers   jsonb not null default '[]'::jsonb,
  followups_by_ai    boolean,
  followups_asked_at timestamptz,
  submitted_at       timestamptz,
  submitted_late     boolean,
  verdict            work_verdict,
  feedback           text not null default '' check (length(feedback) <= 4000),
  marked_by          uuid
                     references auth.users (id) on delete set null,
  marked_at          timestamptz
);

create index if not exists matter_attempts_user_idx
  on public.matter_attempts (user_id, matter_id, started_at desc);

-- One open attempt per person per matter. Another go is a new attempt, once
-- the last one is handed in.
create unique index if not exists matter_attempts_one_open
  on public.matter_attempts (matter_id, user_id) where submitted_at is null;

-- Starting: the clock, the deadline and the copy of the matter are the
-- database's, never the request's. Security definer, because the copy is
-- taken from columns a learner cannot read; the lawyer's approach is left out
-- of it all the same.
create or replace function public.stamp_matter_attempt()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m public.matters%rowtype;
begin
  select * into m from public.matters where id = new.matter_id;
  if not found then
    raise exception 'That matter does not exist';
  end if;
  new.started_at := now();
  new.deadline_at := now() + make_interval(mins => m.time_limit_minutes);
  new.snapshot := jsonb_build_object(
    'number', m.number,
    'title', m.title,
    'country', m.country,
    'area', m.area,
    'brief', m.brief,
    'time_limit_minutes', m.time_limit_minutes,
    'procedure_prompt', m.procedure_prompt,
    'draft_prompt', m.draft_prompt,
    'speak_prompt', m.speak_prompt
  );
  new.procedure_answer := '';
  new.draft_answer := '';
  new.recording_path := null;
  new.recording_seconds := null;
  new.followup_questions := '[]'::jsonb;
  new.followup_answers := '[]'::jsonb;
  new.followups_by_ai := null;
  new.followups_asked_at := null;
  new.submitted_at := null;
  new.submitted_late := null;
  new.verdict := null;
  new.feedback := '';
  new.marked_by := null;
  new.marked_at := null;
  return new;
end;
$$;

create or replace trigger matter_attempts_stamp
  before insert on public.matter_attempts
  for each row execute function public.stamp_matter_attempt();

-- After starting: the start, the deadline, the copy and whose it is never
-- change. Handing in stamps its own time and whether it was late. Once
-- handed in, what was handed in is frozen; marking may set the verdict and
-- the paragraph, and only on something handed in.
create or replace function public.guard_matter_attempt()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.matter_id is distinct from old.matter_id
     or new.user_id is distinct from old.user_id
     or new.started_at is distinct from old.started_at
     or new.deadline_at is distinct from old.deadline_at
     or new.snapshot is distinct from old.snapshot then
    raise exception 'An attempt keeps the matter, the person and the clock it started with';
  end if;

  if old.submitted_at is not null then
    if new.procedure_answer is distinct from old.procedure_answer
       or new.draft_answer is distinct from old.draft_answer
       or new.recording_path is distinct from old.recording_path
       or new.recording_seconds is distinct from old.recording_seconds
       or new.followup_questions is distinct from old.followup_questions
       or new.followup_answers is distinct from old.followup_answers
       or new.followups_by_ai is distinct from old.followups_by_ai
       or new.followups_asked_at is distinct from old.followups_asked_at
       or new.submitted_at is distinct from old.submitted_at
       or new.submitted_late is distinct from old.submitted_late then
      raise exception 'What was handed in is not changed afterwards';
    end if;
  elsif new.submitted_at is not null then
    new.submitted_at := now();
    new.submitted_late := now() > old.deadline_at;
  end if;

  if new.verdict is distinct from old.verdict or new.feedback is distinct from old.feedback then
    if old.submitted_at is null then
      raise exception 'Only an attempt that has been handed in can be marked';
    end if;
    new.marked_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger matter_attempts_guard
  before update on public.matter_attempts
  for each row execute function public.guard_matter_attempt();

alter table public.matter_attempts enable row level security;

drop policy if exists matter_attempts_read on public.matter_attempts;
create policy matter_attempts_read on public.matter_attempts
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

-- Starting one: as yourself, on a matter you can see that is up.
drop policy if exists matter_attempts_start on public.matter_attempts;
create policy matter_attempts_start on public.matter_attempts
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matters m
      where m.id = matter_attempts.matter_id and m.published
    )
  );

-- Working on it: your own, until it is handed in. The guard above keeps the
-- clock and the copy fixed, and freezes it at hand-in.
drop policy if exists matter_attempts_work on public.matter_attempts;
create policy matter_attempts_work on public.matter_attempts
  for update to authenticated
  using (user_id = auth.uid() and submitted_at is null)
  with check (user_id = auth.uid() and verdict is null and marked_by is null);

-- Learners may change only the columns their work lives in. The follow-up
-- questions are written by the server, which asks them; the answers are the
-- learner's.
revoke update on public.matter_attempts from anon, authenticated;
grant update (
  procedure_answer, draft_answer, recording_path, recording_seconds,
  followup_answers, submitted_at
) on public.matter_attempts to authenticated;

-- -----------------------------------------------------------------------------
-- 3. The lawyer's approach, after you have handed in your own
-- -----------------------------------------------------------------------------
create or replace function public.matter_model_answer(attempt uuid)
returns table (model_answer text, sources text)
language sql
stable
security definer
set search_path = public
as $$
  select m.model_answer, m.sources
  from public.matter_attempts a
  join public.matters m on m.id = a.matter_id
  where a.id = attempt
    and auth.uid() is not null
    and (
      public.is_coach()
      or (a.user_id = auth.uid() and a.submitted_at is not null)
    );
$$;

revoke all on function public.matter_model_answer(uuid) from public;
revoke all on function public.matter_model_answer(uuid) from anon;
grant execute on function public.matter_model_answer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Recordings
-- -----------------------------------------------------------------------------
-- Private. A learner uploads into their own folder, for an attempt of their
-- own that is still open; only staff read the bucket directly, and a learner
-- hears their own recording through a short-lived link the server signs
-- after reading the attempt through their own client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('matter-recordings', 'matter-recordings', false, 4194304, array[
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists matter_recordings_insert_own on storage.objects;
create policy matter_recordings_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'matter-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.matter_attempts a
      where a.user_id = auth.uid()
        and a.submitted_at is null
        and a.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists matter_recordings_staff_read on storage.objects;
create policy matter_recordings_staff_read on storage.objects
  for select to authenticated using (
    bucket_id = 'matter-recordings' and public.is_coach()
  );

-- -----------------------------------------------------------------------------
-- 5. Certificates
-- -----------------------------------------------------------------------------
-- Issued once, by the server, the first time somebody is seen to have met
-- the requirements: every required module finished and the set number of
-- matters marked Good by a lawyer. Insert and select only, like every other
-- record a firm might rely on.
create table if not exists public.certificates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique
             references auth.users (id) on delete cascade,
  country    country not null,
  matters    smallint not null check (matters >= 1),
  issued_at  timestamptz not null default now()
);

create or replace function public.stamp_certificate()
returns trigger language plpgsql set search_path = public as $$
begin
  new.issued_at := now();
  return new;
end;
$$;

create or replace trigger certificates_stamp
  before insert on public.certificates
  for each row execute function public.stamp_certificate();

alter table public.certificates enable row level security;

drop policy if exists certificates_read on public.certificates;
create policy certificates_read on public.certificates
  for select to authenticated using (user_id = auth.uid() or public.is_coach());


-- >>> 0028_draft_matters.sql --------------------------------------

-- =============================================================================
-- Five draft Malaysian matters, unchecked
-- =============================================================================
-- Written with AI assistance as a starting point, on invented facts. They go
-- in unpublished and unsigned, with no author recorded, so that a lawyer can
-- read each one, correct it, and sign it off in the admin area before any
-- learner sees it. Nothing here is a statement of the law until then: the
-- schema refuses to publish a matter nobody has signed off.
--
-- Re-running this file does nothing to a matter that is already there, so a
-- lawyer's corrections are never overwritten.
-- =============================================================================

insert into public.matters (slug, number, title, country, area, brief, time_limit_minutes, model_answer, sources)
values
(
  'my-statutory-demand', 1, 'A statutory demand', 'MY', 'Companies and insolvency',
  $b$Your client, Harimau Fabrication Sdn Bhd, has received a notice of demand under section 466 of the Companies Act 2016 from a supplier, Kilang Besi Utara Sdn Bhd, for RM180,000 said to be due on three invoices. The demand was served at the client's registered office nine days ago.

The client's managing director tells you the steel delivered under the second and third invoices (RM120,000 together) was the wrong grade and was rejected in writing within a week of delivery. The supplier never replied to the rejection. The first invoice (RM60,000) is not disputed, but the client says it has been short of cash since a large customer paid late.

The managing director wants to know whether the company is about to be wound up, and what it should do this week.$b$,
  45,
  $m$How a lawyer would approach it

1. Work out the clock first. A company that does not pay, secure or compound the sum within the time stated in a section 466 demand is deemed unable to pay its debts, which opens the door to a winding-up petition. Check the period the Act now gives and the current prescribed threshold, count from service, and diarise the last day. With nine days gone there is little time.

2. Separate the undisputed part from the disputed part. RM60,000 is admitted. The disputed RM120,000 turns on rejection of the goods, and there is a written rejection the supplier never answered. That is the kind of evidence a court looks for before accepting a dispute is genuine.

3. Identify the procedure. Malaysian practice does not have a separate application to set aside a statutory demand. The usual protective step is an application for an injunction to restrain the presentation of a winding-up petition, on the basis that the debt is bona fide disputed on substantial grounds. A court will also ask whether the company is solvent and whether the undisputed part has been paid or tendered.

4. Advise on the undisputed RM60,000. Paying or tendering it, or offering security, removes the easiest ground for a petition and strengthens the injunction application on the rest. If cash is short, a written proposal to pay by instalments is better than silence.

5. Write to the supplier now: set out the rejection, attach the correspondence, state that RM120,000 is disputed, and ask for an undertaking not to present a petition. Keep it factual.

6. Gather the evidence an affidavit will need: the purchase orders, specifications, delivery orders, the rejection letter and proof it was sent, and any test results on the steel.

The advice to the client, in one line: the company is not wound up by the demand itself, but it must act before the period runs out; pay or offer terms on the RM60,000, dispute the RM120,000 in writing with the evidence, and be ready to apply for an injunction if the supplier will not undertake to hold off.$m$,
  $s$Companies Act 2016, ss 465 and 466. Rules of Court 2012, O 29 (injunctions). Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-default-judgment', 2, 'Judgment in default', 'MY', 'Civil procedure',
  $b$Your client, Puan Rosnah, runs a small catering business. She tells you a sealed writ and statement of claim from a party-hire company, Majlis Ceria Enterprise, were left with her son at her house five weeks ago. She thought it was a sales letter and put it in a drawer. Yesterday she received a judgment in default of appearance for RM46,500, with costs.

She says she never agreed the price claimed. She hired tents and chairs for a wedding, but half the chairs never arrived, she complained by WhatsApp on the day, and the company's manager replied that they would "sort out the bill later". She has the messages.

She wants the judgment gone.$b$,
  40,
  $m$How a lawyer would approach it

1. Read the judgment and the court file before anything else: which court, the date of service on the affidavit of service, the date the judgment was entered, and on what basis.

2. Identify the procedure. A judgment entered in default of appearance can be set aside by the court under the Rules of Court 2012 (O 13 r 8), on application by summons supported by an affidavit.

3. Ask whether the judgment is regular or irregular. If service was not properly effected, or the judgment was entered too early, it is irregular and the defendant is generally entitled to have it set aside. Check how the writ was served (leaving it with a family member at home may or may not be good service depending on the mode used) and count the days allowed to enter appearance from the date of service.

4. If it is regular, the client needs to show a defence on the merits: an issue that deserves to be tried. Here, the missing chairs, the complaint on the day and the manager's reply about sorting out the bill go to the amount claimed. Exhibit the messages.

5. Explain the delay honestly in the affidavit. Courts look at how promptly the application is made once the defendant knows of the judgment. File quickly, and ask for a stay of execution in the meantime if enforcement is threatened.

6. Prepare the draft defence to exhibit, so the court can see the defence is real.

The advice to the client, in one line: the judgment can be challenged, but she must move now; we will check whether it was properly obtained, and if it was, we will ask the court to set it aside because she has a real defence on the amount, supported by her messages.$m$,
  $s$Rules of Court 2012, O 12, O 13 r 8. Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-limitation', 3, 'An old debt', 'MY', 'Limitation',
  $b$A new client, Encik Farid, lent RM75,000 to a former business partner, Mr Tan, under a written loan agreement signed in March 2019. The full sum was repayable in one lump on 1 March 2020. Mr Tan paid nothing.

In June 2023 Mr Tan sent Encik Farid a WhatsApp message: "I know I owe you the 75k, give me until end of year." Nothing more was paid. Encik Farid has now come to you, in October 2026, asking to sue.

He wants to know if it is too late.$b$,
  35,
  $m$How a lawyer would approach it

1. Identify the cause of action and when it accrued. This is a claim in contract for a debt. The cause of action accrued when the money became repayable and was not paid: 1 March 2020.

2. Identify the limitation period. Under the Limitation Act 1953 (Peninsular Malaysia), an action founded on a contract may not be brought after six years from the date on which the cause of action accrued. Six years from 1 March 2020 ends on 1 March 2026, so on that count the claim is already out of time in October 2026.

3. Look for anything that restarts the clock. The Act provides that where a debt is acknowledged in writing signed by the person liable, the right of action is treated as accruing on the date of the acknowledgment. The June 2023 message admits the debt. If it qualifies as a signed written acknowledgment, time runs afresh from June 2023 and the claim is in time until June 2029.

4. That turns on the message. Check the exact words, that it clearly came from Mr Tan's number, and whether an electronic message satisfies the requirements of writing and signature. Preserve it properly: screenshots, the phone itself, and the chat export.

5. Check the place. If the parties or the transaction are in Sabah or Sarawak, the limitation law there is different and must be checked separately.

6. Act promptly either way: send a letter of demand, then file.

The advice to the client, in one line: on the original dates the claim would be out of time, but Mr Tan's 2023 message admitting the debt is likely to restart the clock, so the claim can probably still be brought; we need to secure that message and issue soon.$m$,
  $s$Limitation Act 1953, ss 6 and 26. Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-summary-judgment', 4, 'A defence that does not hold', 'MY', 'Civil procedure',
  $b$Your firm acts for Sinar Logistik Sdn Bhd, which delivered goods for a retailer, Kedai Rumah Hijau Sdn Bhd, for twelve months. Kedai Rumah Hijau stopped paying in the last three months and owes RM212,400 on invoices it signed for on delivery. Its finance manager confirmed the amount in an email in August.

You issued a writ. The defendant entered appearance and has now filed a two-paragraph defence saying only that "the Defendant denies being indebted to the Plaintiff and puts the Plaintiff to strict proof".

Your partner asks you how to bring this to an end without a full trial.$b$,
  45,
  $m$How a lawyer would approach it

1. Identify the procedure: summary judgment under Order 14 of the Rules of Court 2012. It is available where the defendant has entered appearance, and the plaintiff says there is no defence to the claim.

2. Prepare the application: a summons in Form 14 (check the current form), supported by an affidavit verifying the facts and stating the deponent's belief that there is no defence. Exhibit the signed delivery orders, the invoices, the statement of account, and the finance manager's email confirming the amount.

3. Understand the test. Once the plaintiff shows a prima facie case, the burden moves to the defendant to show a triable issue or some other reason for a trial. A bare denial, as here, is generally not enough; the court looks for a real dispute supported by facts.

4. Watch the timing. Check the time limits in Order 14 for filing the application after the defence is served, and diarise them.

5. Expect the defendant to respond with an affidavit raising new points (quality, set-off, a disputed rate). Prepare for that: are any of those points answered by the signed delivery orders and the August email?

6. Ask for interest and costs in the summons, and consider whether part of the claim should be pursued separately if a genuine dispute appears on part only.

The advice, in one line: apply for summary judgment under Order 14 now, with the signed documents and the August email; a bare denial does not raise a triable issue.$m$,
  $s$Rules of Court 2012, O 14. Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-interim-injunction', 5, 'Stop the sale', 'MY', 'Injunctions',
  $b$Your client, Dr Leela, is one of two equal shareholders and directors of a clinic company, Klinik Seri Pagi Sdn Bhd. She learned this morning that the other director has signed an agreement to sell the clinic's only premises to his brother-in-law for well below market value. Completion is set for Friday, four days away. No board meeting was held and Dr Leela was not told.

She has the land search, a valuation from last year, and a message from the clinic's accountant mentioning the sale.

She wants it stopped before Friday.$b$,
  45,
  $m$How a lawyer would approach it

1. Identify the procedure: an application for an interim injunction under Order 29 of the Rules of Court 2012, made urgently and, if necessary, ex parte first, given the four days. An ex parte injunction is short-lived and is followed by an inter partes hearing.

2. Identify the underlying claim the injunction protects. The injunction is not free-standing: there must be a cause of action, for example breach of directors' duties, lack of authority to sell without a board resolution, or a shareholder's remedy. A writ or originating process should be filed with, or immediately after, the application.

3. Apply the test the Malaysian courts follow for interim injunctions: is there a bona fide serious issue to be tried; where does the balance of convenience lie, including whether damages would be an adequate remedy; and the court's overall sense of where the least injustice lies. Land is usually treated as unique, which helps on adequacy of damages.

4. Full and frank disclosure. On an ex parte application the client must put everything material before the court, including points against her. Failure can lose the injunction.

5. The undertaking as to damages. The court will usually require the applicant to undertake to pay damages if the injunction turns out to have been wrongly granted. Explain this to Dr Leela, and check she can stand behind it.

6. Evidence by Friday: an affidavit exhibiting the land search, the valuation, the accountant's message, the company's constitution on directors' powers, and any minutes. Consider also lodging a private caveat if there is a caveatable interest, and writing to the purchaser putting them on notice.

The advice, in one line: we can ask the court for an urgent injunction to stop completion, on the basis that the sale was not authorised and is at an undervalue, but she must give an undertaking as to damages and we must disclose everything relevant.$m$,
  $s$Rules of Court 2012, O 29. Companies Act 2016 (directors' duties). Draft written with AI assistance, not yet checked by a lawyer.$s$
)
on conflict (slug) do nothing;


-- >>> 0029_email_work.sql -----------------------------------------

-- =============================================================================
-- Work that arrives by email
-- =============================================================================
-- A lawyer emails a piece of work to the academy's address. The app turns it
-- into a draft post on the work board, under the lawyer's name, and the
-- lawyer checks it and presses Publish. Nothing that arrives by email is ever
-- published by arriving: the post starts unpublished, like any other draft.
--
-- Three columns say where a post came from, so the board can show a draft
-- from email as one, with a reminder to take out client names before it goes
-- up. The email's own message id is kept so that the same email delivered
-- twice (inbound services retry) makes one draft, not two.
-- =============================================================================

alter table public.work_posts
  add column if not exists source text not null default 'form';
alter table public.work_posts drop constraint if exists work_posts_source_known;
alter table public.work_posts
  add constraint work_posts_source_known check (source in ('form', 'email'));

alter table public.work_posts add column if not exists inbound_message_id text;
alter table public.work_posts add column if not exists inbound_from text;
-- Whether the sending domain's own check (SPF) passed. A draft that failed it
-- is still made, because forwarding breaks SPF more often than forgery does,
-- but the page says so, and it is still only a draft.
alter table public.work_posts add column if not exists inbound_verified boolean;

create unique index if not exists work_posts_inbound_message_once
  on public.work_posts (inbound_message_id) where inbound_message_id is not null;


-- >>> 0030_access.sql ---------------------------------------------

-- =============================================================================
-- Who pays, and who does not
-- =============================================================================
-- Somebody training on their own pays. Somebody at a firm or university the
-- academy works with does not: their firm gives them a code, they enter it,
-- and a coach or administrator confirms they really are with that firm. A
-- code on its own opens nothing, because codes get passed around.
--
-- Staff, confirmed trainees and people who joined by a firm's invitation are
-- free without a code, and that is decided in the app, from what the
-- database already records about them.
--
-- Nothing in these three tables is written by a learner. Asking to use a
-- code, recording a payment and confirming a person all go through the
-- server, after it has checked who is asking, so a learner cannot mark
-- themselves as paid or confirmed by writing to a table.
-- =============================================================================

create table if not exists public.access_codes (
  id          uuid primary key default gen_random_uuid(),
  -- What people type: capitals, digits and hyphens, so that "thomas philip"
  -- and "THOMAS-PHILIP" are not two codes that look the same to a person.
  code        text not null unique,
  -- Who it is for, as a person would say it: "Thomas Philip".
  label       text not null,
  active      boolean not null default true,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.access_codes drop constraint if exists access_codes_code_shape;
alter table public.access_codes
  add constraint access_codes_code_shape check (code ~ '^[A-Z0-9-]{4,32}$');
alter table public.access_codes drop constraint if exists access_codes_label_present;
alter table public.access_codes
  add constraint access_codes_label_present check (length(trim(label)) between 1 and 120);

alter table public.access_codes enable row level security;

-- Administrators see the list. Learners never read it: a code is checked by
-- the server, one at a time, so nobody can list what codes exist.
drop policy if exists access_codes_admin_read on public.access_codes;
create policy access_codes_admin_read on public.access_codes
  for select to authenticated using (public.is_admin());

create table if not exists public.access_grants (
  -- One request per person. Entering another code replaces it.
  user_id      uuid primary key references auth.users (id) on delete cascade,
  code_id      uuid not null references public.access_codes (id) on delete restrict,
  requested_at timestamptz not null default now(),
  decision     text,
  decided_by   uuid references auth.users (id) on delete set null,
  decided_at   timestamptz
);

alter table public.access_grants drop constraint if exists access_grants_decision_known;
alter table public.access_grants
  add constraint access_grants_decision_known check (decision in ('confirmed', 'declined'));
-- Nobody confirms themselves, the same rule as signing off your own work.
alter table public.access_grants drop constraint if exists access_grants_not_self;
alter table public.access_grants
  add constraint access_grants_not_self check (decided_by is null or decided_by <> user_id);

create or replace function public.stamp_access_grant()
returns trigger language plpgsql set search_path = public as $$
begin
  -- A new code is a new request: whatever was decided about the old one
  -- does not carry over to a different firm.
  if tg_op = 'UPDATE' and new.code_id is distinct from old.code_id then
    new.requested_at := now();
    new.decision := null;
    new.decided_by := null;
    new.decided_at := null;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.requested_at := now();
  end if;
  -- The date of a decision is the database's, never the caller's.
  if new.decision is null then
    new.decided_at := null;
    new.decided_by := null;
  elsif tg_op = 'INSERT' or new.decision is distinct from old.decision then
    new.decided_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger access_grants_stamp
  before insert or update on public.access_grants
  for each row execute function public.stamp_access_grant();

create index if not exists access_grants_waiting
  on public.access_grants (requested_at) where decision is null;

alter table public.access_grants enable row level security;

drop policy if exists access_grants_read on public.access_grants;
create policy access_grants_read on public.access_grants
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  -- Stripe's own word for it: active, trialing, past_due, canceled and so on.
  status                 text,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

create or replace function public.touch_subscription()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger subscriptions_touch
  before insert or update on public.subscriptions
  for each row execute function public.touch_subscription();

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());


-- >>> 0031_tutor.sql ----------------------------------------------

-- =============================================================================
-- The tutor
-- =============================================================================
-- Two ways to practise with an AI tutor. "Explain it back": the learner
-- explains an idea as if to a ten-year-old and the tutor stops them at jargon,
-- skipped steps and oversimplification, asking one question at a time.
-- "Test me": five questions from the lawyer-verified bank, one at a time,
-- each followed by what the answer suggests is missing.
--
-- The tutor never states law of its own. What it says about the law comes
-- from a verified question's explanation, which is shown beside it.
--
-- A learner reads their own conversations through the database. Staff read
-- them only through the server, which shows a coach the conversations of
-- people the firm supervises and an administrator everybody's; the page
-- says who can read before the first message. Nothing here is written by a
-- learner directly: the server writes each message after checking who is
-- asking. Once written a message is never changed or deleted, with one
-- exception: an administrator may blank one (somebody typed a client's
-- name), and the record shows who did it and when.
-- =============================================================================

create table if not exists public.tutor_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  mode        text not null,
  topic       text not null,
  -- The module a "Test me" draws its questions from.
  module_slug text,
  created_at  timestamptz not null default now()
);

-- How many questions this "Test me" was set at when it started, so the
-- count it shows ("Question 2 of 5") does not move if questions are
-- signed off or taken back while it runs.
alter table public.tutor_conversations add column if not exists test_length smallint;

alter table public.tutor_conversations drop constraint if exists tutor_conversations_mode_known;
alter table public.tutor_conversations
  add constraint tutor_conversations_mode_known check (mode in ('explain', 'test'));
alter table public.tutor_conversations drop constraint if exists tutor_conversations_topic_present;
alter table public.tutor_conversations
  add constraint tutor_conversations_topic_present check (length(trim(topic)) between 1 and 200);
alter table public.tutor_conversations drop constraint if exists tutor_conversations_test_length_range;
alter table public.tutor_conversations
  add constraint tutor_conversations_test_length_range
  check (test_length is null or test_length between 1 and 5);

create index if not exists tutor_conversations_by_user
  on public.tutor_conversations (user_id, created_at desc);

create table if not exists public.tutor_messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.tutor_conversations (id) on delete cascade,
  role                text not null,
  body                text not null,
  -- "Test me": the verified question this message asks or answers.
  question_version_id uuid references public.question_versions (id) on delete restrict,
  -- "Test me": the option the learner chose, and whether it was right,
  -- worked out by the server from the answer key.
  chosen_option       text,
  correct             boolean,
  created_at          timestamptz not null default now()
);

-- When an administrator blanked this message, and who.
alter table public.tutor_messages add column if not exists redacted_at timestamptz;
alter table public.tutor_messages
  add column if not exists redacted_by uuid references auth.users (id) on delete set null;

alter table public.tutor_messages drop constraint if exists tutor_messages_role_known;
alter table public.tutor_messages
  add constraint tutor_messages_role_known check (role in ('learner', 'tutor'));
alter table public.tutor_messages drop constraint if exists tutor_messages_body_present;
alter table public.tutor_messages
  add constraint tutor_messages_body_present check (length(trim(body)) between 1 and 6000);

create index if not exists tutor_messages_by_conversation
  on public.tutor_messages (conversation_id, created_at);

-- One answer to each question in a test, and each question asked once. Two
-- presses of "Answer" (or two tabs) cannot both be marked, and cannot ask
-- the next question twice.
create unique index if not exists tutor_messages_one_answer
  on public.tutor_messages (conversation_id, question_version_id)
  where role = 'learner' and question_version_id is not null;
create unique index if not exists tutor_messages_one_asking
  on public.tutor_messages (conversation_id, question_version_id)
  where role = 'tutor' and question_version_id is not null;

-- The time of a row is the database's, and a row, once written, stays as it
-- was: a coach reading a conversation reads what was said. Nothing is
-- deleted on its own either; a conversation goes only when the account it
-- belongs to does (a delete that arrives by cascade, from inside another
-- trigger, so pg_trigger_depth() is above one).
create or replace function public.stamp_tutor_row()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    return new;
  end if;
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'tutor conversations are kept as they were said';
end;
$$;

-- A message: the same, except that an administrator may blank one, once.
-- Only the body changes, only to the fixed words, and the time is the
-- database's. Who did it is set by the server from the signed-in
-- administrator and must be present.
create or replace function public.guard_tutor_message()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.redacted_at := null;
    new.redacted_by := null;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if pg_trigger_depth() > 1 then
      return old;
    end if;
    raise exception 'tutor conversations are kept as they were said';
  end if;
  if old.redacted_at is null
     and new.redacted_by is not null
     and new.body = '[Removed by an administrator]'
     and (new.id, new.conversation_id, new.role, new.question_version_id,
          new.chosen_option, new.correct, new.created_at)
         is not distinct from
         (old.id, old.conversation_id, old.role, old.question_version_id,
          old.chosen_option, old.correct, old.created_at) then
    new.redacted_at := now();
    return new;
  end if;
  raise exception 'tutor conversations are kept as they were said';
end;
$$;

create or replace trigger tutor_conversations_stamp
  before insert or update or delete on public.tutor_conversations
  for each row execute function public.stamp_tutor_row();
create or replace trigger tutor_messages_stamp
  before insert or update or delete on public.tutor_messages
  for each row execute function public.guard_tutor_message();

alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;

drop policy if exists tutor_conversations_read on public.tutor_conversations;
create policy tutor_conversations_read on public.tutor_conversations
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tutor_messages_read on public.tutor_messages;
create policy tutor_messages_read on public.tutor_messages
  for select to authenticated using (
    exists (
      select 1 from public.tutor_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );


-- >>> 0032_lesson_signoffs.sql ------------------------------------

-- =============================================================================
-- Lesson sign-offs
-- =============================================================================
-- Lessons are written in the code, not the database, so a reviewer can fix a
-- sentence in one line. Until now nothing recorded that a lawyer had read
-- one. This does: a coach or administrator signs off a lesson exactly as it
-- stands, and the sign-off is pinned to a fingerprint of every word a learner
-- sees (`content_hash`, SHA-256 of the lesson's content). Change a word, a
-- guess or which answer is right and the fingerprint changes, so the old
-- sign-off no longer covers it and the lesson needs signing again.
--
-- A rewritten lesson is shown to learners only once it is signed off. A
-- sign-off is a record somebody is answerable for: it is written by the
-- server after checking who is asking, carries their name and the
-- database's time, and is never changed or deleted.
-- =============================================================================

create table if not exists public.lesson_signoffs (
  id           uuid primary key default gen_random_uuid(),
  lesson_slug  text not null,
  content_hash text not null,
  signed_by    uuid not null references auth.users (id) on delete restrict,
  signed_at    timestamptz not null default now()
);

alter table public.lesson_signoffs drop constraint if exists lesson_signoffs_slug_shape;
alter table public.lesson_signoffs
  add constraint lesson_signoffs_slug_shape check (lesson_slug ~ '^[a-z0-9-]{3,80}$');
alter table public.lesson_signoffs drop constraint if exists lesson_signoffs_hash_shape;
alter table public.lesson_signoffs
  add constraint lesson_signoffs_hash_shape check (content_hash ~ '^[0-9a-f]{64}$');

-- One sign-off per wording. Signing the same words twice adds nothing.
create unique index if not exists lesson_signoffs_one_per_wording
  on public.lesson_signoffs (lesson_slug, content_hash);

-- Only a coach or administrator signs a lesson off, the time is the
-- database's, and a sign-off, once given, stays as it was.
create or replace function public.guard_lesson_signoff()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.signed_by and (p.is_coach or p.is_admin)
    ) then
      raise exception 'a lesson is signed off by a coach or an administrator';
    end if;
    new.signed_at := now();
    return new;
  end if;
  raise exception 'a lesson sign-off is kept as it was given';
end;
$$;

create or replace trigger lesson_signoffs_guard
  before insert or update or delete on public.lesson_signoffs
  for each row execute function public.guard_lesson_signoff();

-- Read and written by the server only: no policy lets anybody at it through
-- the database directly, so a learner's browser cannot add one.
alter table public.lesson_signoffs enable row level security;


-- >>> 0033_cartoon_avatar.sql -------------------------------------

-- =============================================================================
-- A cartoon of yourself
-- =============================================================================
-- Trainees can build a cartoon face (skin, hair, eyes, glasses, clothes and
-- so on) and it shows beside their name instead of a photo or an initial.
-- Nothing is drawn from a photo: the person picks every part themselves, and
-- what is stored is the list of choices, never a picture.
--
-- The app only ever saves choices from a fixed list in the code and draws the
-- face from them. The database cannot know that list, so it holds the shape:
-- a small object whose names and values are short plain words, nothing
-- else: no lists, no objects, no markup. A value that is not on the app's
-- list is ignored when the face is drawn.
--
-- A person sets and clears their own, through their own session, under the
-- existing rule that a learner may only update their own profile.
-- =============================================================================

alter table public.profiles
  add column if not exists avatar_style jsonb;

alter table public.profiles drop constraint if exists profiles_avatar_style_shape;
alter table public.profiles
  add constraint profiles_avatar_style_shape check (
    avatar_style is null
    or (
      jsonb_typeof(avatar_style) = 'object'
      and octet_length(avatar_style::text) <= 1024
      -- Strict mode: in the default (lax) mode a list is opened up before
      -- it is tested, so ["bob","fro"] would pass as if it were words.
      and not jsonb_path_exists(avatar_style, 'strict $.* ? (@.type() != "string")')
      and not jsonb_path_exists(avatar_style, 'strict $.* ? (!(@ like_regex "^[A-Za-z0-9]{1,40}$"))')
      and not jsonb_path_exists(avatar_style, 'strict $.keyvalue() ? (!(@.key like_regex "^[A-Za-z]{1,40}$"))')
    )
  );


-- >>> 0034_trainee_answer_summary.sql -----------------------------

-- =============================================================================
-- How each learner is getting on, counted in the database
-- =============================================================================
-- Admin, Trainees shows, for each learner, how many questions they answered
-- in the last thirty days, how many were right, when they last answered,
-- and the concept they are weakest on. Those figures were counted in the
-- app from the raw answers, and a request returns at most a thousand rows,
-- so a busy month quietly undercounted everyone. This counts them here and
-- returns one row per person.
--
-- Only the server calls it, after it has checked who is asking and narrowed
-- the list to the people that reader may see. Nobody can call it from the
-- browser.
-- =============================================================================

create or replace function public.learner_answer_summary(ids uuid[], since timestamptz)
returns table (
  user_id       uuid,
  answered      integer,
  right_answers integer,
  last_answered timestamptz,
  weakest       text
)
language sql
stable
set search_path = public
as $$
  select
    p.id as user_id,
    coalesce(a.answered, 0)::integer,
    coalesce(a.right_answers, 0)::integer,
    a.last_answered,
    w.name
  from unnest(ids) as p(id)
  left join lateral (
    select
      count(*) as answered,
      count(*) filter (where q.is_correct) as right_answers,
      max(q.answered_at) as last_answered
    from public.user_question_attempts q
    where q.user_id = p.id
      and q.answered_at >= since
  ) a on true
  left join lateral (
    select c.name
    from public.user_concept_mastery m
    join public.concepts c on c.id = m.concept_id
    where m.user_id = p.id
      and m.attempts >= 2
    order by m.mastery asc, c.name asc
    limit 1
  ) w on true
$$;

revoke all on function public.learner_answer_summary(uuid[], timestamptz) from public;
revoke all on function public.learner_answer_summary(uuid[], timestamptz) from anon;
revoke all on function public.learner_answer_summary(uuid[], timestamptz) from authenticated;
grant execute on function public.learner_answer_summary(uuid[], timestamptz) to service_role;


-- >>> 0035_relabel_questions.sql ----------------------------------

-- =============================================================================
-- Every question's labels, reviewed strictly
-- =============================================================================
-- Scores by area and by topic are built from the labels on each question:
-- its area (domain), its topics (concepts) and its skills. Those labels were
-- attached loosely when the questions were drafted, and a rule that every
-- question must carry a skill forced one onto recall questions ("which court
-- sits in the middle" was tagged attention to detail). In October 2026 every
-- question was reviewed against one rule: a label stays only where answering
-- the question correctly genuinely depends on it. 201 of 203 changed.
--
-- The labels in the code are the same as these. This brings a database that
-- already has the questions up to date, since the app only loads content
-- the database does not have. Running it again changes nothing. A database
-- without the questions yet is unaffected; they arrive labelled correctly.
--
-- What learners have already been credited for under the old labels stays
-- in their record; new answers count under the new ones.
--
-- One statement, on purpose. The Supabase SQL editor can run each statement
-- on its own connection, so a scratch table made by one statement was gone
-- by the next ("relation relabel_0035 does not exist"). Here the list is part
-- of every statement that uses it, inside a single block.
-- =============================================================================

do $$
begin
  drop table if exists relabel_0035;
  create temporary table relabel_0035 (
    slug     text primary key,
    domain   text not null,
    concepts text[] not null,
    skills   text[] not null
  ) on commit drop;

  insert into relabel_0035 (slug, domain, concepts, skills) values
  ('my-cs-apex-court', 'court-system', array['my-court-structure', 'court-hierarchy']::text[], array[]::text[]),
  ('my-cs-two-high-courts', 'court-system', array['my-court-structure']::text[], array[]::text[]),
  ('my-cs-subordinate-courts', 'court-system', array['my-court-structure']::text[], array[]::text[]),
  ('my-cs-sessions-limit', 'court-system', array['my-monetary-jurisdiction']::text[], array[]::text[]),
  ('my-cs-magistrates-limit', 'court-system', array['my-monetary-jurisdiction']::text[], array[]::text[]),
  ('my-cs-syariah-separate', 'court-system', array['syariah-courts']::text[], array[]::text[]),
  ('my-cs-appeal-from-sessions', 'court-system', array['appellate-structure', 'my-court-structure']::text[], array[]::text[]),
  ('my-cs-leave-to-federal-court', 'court-system', array['appellate-structure', 'my-court-structure']::text[], array['procedural-sequencing']::text[]),
  ('my-cp-rules-of-court', 'civil-procedure', array['rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-writ-or-os', 'civil-procedure', array['originating-process']::text[], array['strategic-reasoning']::text[]),
  ('my-cp-writ-validity', 'civil-procedure', array['originating-process', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-limitation-contract', 'civil-procedure', array['limitation-periods']::text[], array[]::text[]),
  ('my-cp-appearance-time', 'civil-procedure', array['originating-process', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-default-judgment', 'civil-procedure', array['default-judgment']::text[], array['procedural-sequencing']::text[]),
  ('my-cp-order-14', 'civil-procedure', array['summary-judgment', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-discovery', 'civil-procedure', array['discovery', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-costs-follow-event', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('my-ev-evidence-act', 'evidence', array['evidence-act-1950']::text[], array[]::text[]),
  ('my-ev-relevance-code', 'evidence', array['evidence-act-1950', 'relevance']::text[], array[]::text[]),
  ('my-ev-expert-opinion', 'evidence', array['evidence-act-1950', 'opinion-evidence']::text[], array[]::text[]),
  ('my-ev-privilege', 'evidence', array['evidence-act-1950', 'client-legal-privilege']::text[], array[]::text[]),
  ('my-ev-without-prejudice', 'evidence', array['settlement-privilege']::text[], array[]::text[]),
  ('my-ev-burden', 'evidence', array['evidence-act-1950', 'onus-of-proof']::text[], array[]::text[]),
  ('my-ev-civil-standard', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('my-ad-leading-questions', 'evidence', array['questioning-rules', 'evidence-act-1950']::text[], array[]::text[]),
  ('my-ad-duty-to-court', 'advocacy', array['duty-to-court', 'candour-and-disclosure']::text[], array['professional-judgment']::text[]),
  ('my-ad-reexamination', 'advocacy', array['re-examination']::text[], array[]::text[]),
  ('my-ad-answer-the-bench', 'advocacy', array['oral-submissions']::text[], array['strategic-reasoning']::text[]),
  ('my-dr-statement-of-claim', 'drafting', array['drafting-pleadings', 'pleadings']::text[], array[]::text[]),
  ('my-dr-affidavit-content', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('my-dr-prayer-for-relief', 'drafting', array['relief-claimed']::text[], array[]::text[]),
  ('my-lr-federal-court-binds', 'legal-reasoning', array['stare-decisis']::text[], array['argument-construction']::text[]),
  ('my-lr-ratio-obiter', 'legal-reasoning', array['ratio-and-obiter']::text[], array[]::text[]),
  ('my-lr-purposive-approach', 'legal-reasoning', array['statutory-interpretation']::text[], array[]::text[]),
  ('my-lr-elements-analysis', 'legal-reasoning', array['elements-analysis', 'issue-identification']::text[], array['argument-construction']::text[]),
  ('my-ad-objection-ground', 'advocacy', array['objections']::text[], array[]::text[]),
  ('my-ad-putting-your-case', 'advocacy', array['browne-v-dunn']::text[], array[]::text[]),
  ('my-dr-letter-of-demand', 'drafting', array['letters-of-demand']::text[], array[]::text[]),
  ('my-dr-chronology', 'drafting', array['chronologies']::text[], array[]::text[]),
  ('my-dr-written-submissions', 'drafting', array['written-submissions']::text[], array[]::text[]),
  ('my-lr-distinguishing', 'legal-reasoning', array['distinguishing']::text[], array[]::text[]),
  ('my-res-start-secondary', 'legal-research', array['research-strategy']::text[], array[]::text[]),
  ('my-res-current-legislation', 'legal-research', array['currency', 'authoritative-sources']::text[], array[]::text[]),
  ('my-res-noting-up', 'legal-research', array['noting-up']::text[], array[]::text[]),
  ('my-res-report-series', 'legal-research', array['authoritative-sources']::text[], array[]::text[]),
  ('my-res-search-terms', 'legal-research', array['search-technique']::text[], array[]::text[]),
  ('my-res-record-and-stop', 'legal-research', array['recording-research']::text[], array[]::text[]),
  ('ch-au-appeal-from-intermediate', 'court-system', array['court-hierarchy', 'appellate-structure']::text[], array[]::text[]),
  ('ch-au-where-hierarchies-meet', 'court-system', array['court-hierarchy', 'federal-jurisdiction']::text[], array[]::text[]),
  ('ch-au-small-claim-starts', 'court-system', array['monetary-jurisdiction']::text[], array[]::text[]),
  ('ch-my-apex', 'court-system', array['my-court-structure', 'court-hierarchy']::text[], array[]::text[]),
  ('ch-my-appeal-from-sessions', 'court-system', array['my-court-structure', 'appellate-structure']::text[], array[]::text[]),
  ('ch-my-two-high-courts', 'court-system', array['my-court-structure', 'court-hierarchy']::text[], array['attention-to-detail']::text[]),
  ('cp-subpoena-non-party-documents', 'civil-procedure', array['subpoenas']::text[], array[]::text[]),
  ('cp-conduct-money', 'civil-procedure', array['subpoenas']::text[], array[]::text[]),
  ('cp-fishing-expedition', 'civil-procedure', array['subpoenas']::text[], array['argument-construction', 'attention-to-detail']::text[]),
  ('cp-discovery-scope', 'civil-procedure', array['discovery']::text[], array[]::text[]),
  ('cp-pleadings-material-facts', 'civil-procedure', array['pleadings']::text[], array[]::text[]),
  ('cp-particulars-function', 'civil-procedure', array['particulars']::text[], array[]::text[]),
  ('cp-default-judgment', 'civil-procedure', array['default-judgment']::text[], array['procedural-sequencing']::text[]),
  ('cp-summary-judgment-vic-test', 'civil-procedure', array['summary-judgment']::text[], array[]::text[]),
  ('cp-limitation-contract-vic', 'civil-procedure', array['limitation-periods']::text[], array[]::text[]),
  ('cp-costs-follow-the-event', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('cp-indemnity-costs', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('cp-interlocutory-meaning', 'civil-procedure', array['interlocutory-applications']::text[], array[]::text[]),
  ('cp-service-purpose', 'civil-procedure', array['originating-process']::text[], array['procedural-sequencing']::text[]),
  ('ev-uniform-evidence-jurisdictions', 'evidence', array['uniform-evidence-acts']::text[], array[]::text[]),
  ('ev-relevance-threshold', 'evidence', array['relevance']::text[], array[]::text[]),
  ('ev-hearsay-definition', 'evidence', array['hearsay']::text[], array[]::text[]),
  ('ev-non-hearsay-purpose', 'evidence', array['hearsay']::text[], array['evidence-analysis']::text[]),
  ('ev-opinion-rule-expert', 'evidence', array['opinion-evidence']::text[], array[]::text[]),
  ('ev-advice-privilege', 'evidence', array['client-legal-privilege']::text[], array[]::text[]),
  ('ev-litigation-privilege-scenario', 'evidence', array['client-legal-privilege']::text[], array['evidence-analysis']::text[]),
  ('ev-without-prejudice', 'evidence', array['settlement-privilege']::text[], array[]::text[]),
  ('ev-civil-standard', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('ev-briginshaw', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('ev-onus-civil', 'evidence', array['onus-of-proof']::text[], array[]::text[]),
  ('ev-business-records', 'evidence', array['documentary-evidence', 'hearsay']::text[], array[]::text[]),
  ('ev-leading-questions-in-chief', 'evidence', array['questioning-rules']::text[], array[]::text[]),
  ('cs-final-court-of-appeal', 'court-system', array['court-hierarchy', 'appellate-structure']::text[], array[]::text[]),
  ('cs-special-leave', 'court-system', array['appellate-structure']::text[], array['procedural-sequencing']::text[]),
  ('cs-vic-intermediate-court', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('cs-nsw-intermediate-court', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('cs-act-no-intermediate', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('cs-vic-appeal-from-county', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('cs-fcfcoa', 'court-system', array['federal-jurisdiction']::text[], array[]::text[]),
  ('cs-mode-of-address-judge', 'court-system', array['courtroom-conduct']::text[], array[]::text[]),
  ('cs-tribunal-not-court', 'court-system', array['tribunals']::text[], array[]::text[]),
  ('cs-leave-interlocutory-appeal', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('cs-first-instance', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('cs-parties-terminology', 'court-system', array['court-terminology']::text[], array['attention-to-detail']::text[]),
  ('cs-vic-magistrates-jurisdictional-limit', 'court-system', array['monetary-jurisdiction']::text[], array[]::text[]),
  ('res-start-secondary', 'legal-research', array['research-strategy']::text[], array['procedural-sequencing']::text[]),
  ('res-currency-legislation', 'legal-research', array['currency']::text[], array[]::text[]),
  ('res-noting-up', 'legal-research', array['noting-up']::text[], array[]::text[]),
  ('res-authorised-report', 'legal-research', array['authoritative-sources']::text[], array[]::text[]),
  ('res-search-terms', 'legal-research', array['search-technique']::text[], array[]::text[]),
  ('res-record-what-you-did', 'legal-research', array['recording-research']::text[], array[]::text[]),
  ('res-when-to-stop', 'legal-research', array['knowing-when-to-stop']::text[], array[]::text[]),
  ('ad-browne-v-dunn', 'advocacy', array['browne-v-dunn']::text[], array[]::text[]),
  ('ad-cross-leading-permitted', 'advocacy', array['cross-examination', 'questioning-rules']::text[], array[]::text[]),
  ('ad-re-examination-scope', 'advocacy', array['re-examination']::text[], array[]::text[]),
  ('ad-paramount-duty', 'advocacy', array['duty-to-court']::text[], array[]::text[]),
  ('ad-adverse-authority', 'advocacy', array['candour-and-disclosure']::text[], array['professional-judgment']::text[]),
  ('ad-no-personal-opinion', 'advocacy', array['candour-and-disclosure']::text[], array[]::text[]),
  ('ad-objection-ground', 'advocacy', array['objections']::text[], array[]::text[]),
  ('ad-opening-purpose', 'advocacy', array['oral-submissions']::text[], array[]::text[]),
  ('ad-answering-judicial-question', 'advocacy', array['oral-submissions']::text[], array['strategic-reasoning']::text[]),
  ('ad-concession', 'advocacy', array['oral-submissions']::text[], array['strategic-reasoning']::text[]),
  ('ad-taking-instructions', 'advocacy', array['oral-submissions']::text[], array['professional-judgment']::text[]),
  ('ad-cross-purpose', 'advocacy', array['cross-examination']::text[], array[]::text[]),
  ('ad-witness-preparation-limit', 'advocacy', array['duty-to-court']::text[], array[]::text[]),
  ('lr-ratio-decidendi', 'legal-reasoning', array['ratio-and-obiter']::text[], array[]::text[]),
  ('lr-obiter-persuasive', 'legal-reasoning', array['ratio-and-obiter', 'stare-decisis']::text[], array[]::text[]),
  ('lr-stare-decisis-hierarchy', 'legal-reasoning', array['stare-decisis']::text[], array[]::text[]),
  ('lr-interstate-appellate', 'legal-reasoning', array['appellate-comity']::text[], array[]::text[]),
  ('lr-comity-single-judges', 'legal-reasoning', array['appellate-comity']::text[], array[]::text[]),
  ('lr-purposive-interpretation', 'legal-reasoning', array['statutory-interpretation']::text[], array[]::text[]),
  ('lr-extrinsic-materials', 'legal-reasoning', array['extrinsic-materials']::text[], array[]::text[]),
  ('lr-text-context-purpose', 'legal-reasoning', array['statutory-interpretation']::text[], array[]::text[]),
  ('lr-elements-analysis', 'legal-reasoning', array['elements-analysis']::text[], array['procedural-sequencing']::text[]),
  ('lr-distinguishing', 'legal-reasoning', array['distinguishing']::text[], array[]::text[]),
  ('lr-issue-identification', 'legal-reasoning', array['issue-identification', 'pleadings']::text[], array['attention-to-detail']::text[]),
  ('lr-analogical-reasoning', 'legal-reasoning', array['distinguishing']::text[], array['argument-construction']::text[]),
  ('lr-dissent-status', 'legal-reasoning', array['ratio-and-obiter']::text[], array[]::text[]),
  ('dr-affidavit-sworn-or-affirmed', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-affidavit-no-submissions', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-affidavit-information-and-belief', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-jurat', 'drafting', array['affidavit-formalities']::text[], array[]::text[]),
  ('dr-exhibit-vs-annexure', 'drafting', array['affidavit-formalities']::text[], array[]::text[]),
  ('dr-statutory-declaration', 'drafting', array['statutory-declarations']::text[], array[]::text[]),
  ('dr-letter-of-demand-elements', 'drafting', array['letters-of-demand']::text[], array['professional-judgment']::text[]),
  ('dr-prayer-for-relief', 'drafting', array['relief-claimed']::text[], array[]::text[]),
  ('dr-chronology-purpose', 'drafting', array['chronologies']::text[], array[]::text[]),
  ('dr-first-person-affidavit', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-alterations-initialled', 'drafting', array['affidavit-formalities']::text[], array[]::text[]),
  ('dr-written-submissions-structure', 'drafting', array['written-submissions']::text[], array[]::text[]),
  ('dr-pleading-a-contract-claim', 'drafting', array['drafting-pleadings']::text[], array[]::text[]),
  ('bas-what-is-a-hierarchy', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('bas-what-is-an-appeal', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('bas-what-binding-means', 'legal-reasoning', array['stare-decisis']::text[], array[]::text[]),
  ('bas-trial-vs-appeal-court', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('bas-what-is-jurisdiction', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('bas-first-instance', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('bas-who-decides-facts', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('bas-parties-names', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('adv-my-striking-out-no-evidence', 'civil-procedure', array['rules-of-court-2012', 'pleadings']::text[], array['attention-to-detail']::text[]),
  ('adv-my-adverse-inference-114g', 'evidence', array['evidence-act-1950']::text[], array['statutory-analysis']::text[]),
  ('adv-my-s91-92-oral-variation', 'evidence', array['evidence-act-1950', 'documentary-evidence']::text[], array['evidence-analysis']::text[]),
  ('adv-my-setting-aside-regular-irregular', 'civil-procedure', array['default-judgment', 'rules-of-court-2012']::text[], array['strategic-reasoning']::text[]),
  ('adv-my-order-14a-point-of-law', 'civil-procedure', array['rules-of-court-2012', 'summary-judgment']::text[], array['strategic-reasoning']::text[]),
  ('adv-my-mareva-requirements', 'civil-procedure', array['interlocutory-applications']::text[], array[]::text[]),
  ('adv-my-anton-piller-threshold', 'civil-procedure', array['interlocutory-applications']::text[], array[]::text[]),
  ('adv-my-federal-court-leave-criteria', 'court-system', array['appellate-structure', 'my-court-structure']::text[], array[]::text[]),
  ('adv-my-order-14-triable-issue', 'civil-procedure', array['summary-judgment', 'rules-of-court-2012']::text[], array[]::text[]),
  ('adv-my-limitation-fraud-postponement', 'civil-procedure', array['limitation-periods']::text[], array['strategic-reasoning']::text[]),
  ('adv-au-anshun-estoppel', 'civil-procedure', array['pleadings']::text[], array['attention-to-detail']::text[]),
  ('adv-au-house-v-king', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('adv-au-browne-v-dunn-remedy', 'advocacy', array['browne-v-dunn']::text[], array[]::text[]),
  ('adv-au-dominant-purpose', 'evidence', array['client-legal-privilege']::text[], array['attention-to-detail', 'evidence-analysis']::text[]),
  ('adv-au-jones-v-dunkel-limit', 'evidence', array['onus-of-proof']::text[], array['evidence-analysis']::text[]),
  ('adv-au-briginshaw', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('adv-au-calderbank-vs-formal-offer', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('adv-au-expert-reasoning-exposed', 'evidence', array['opinion-evidence']::text[], array['evidence-analysis', 'attention-to-detail']::text[]),
  ('adv-au-security-for-costs-impecuniosity', 'civil-procedure', array['costs', 'interlocutory-applications']::text[], array[]::text[]),
  ('adv-au-without-prejudice-exception', 'evidence', array['settlement-privilege']::text[], array['evidence-analysis']::text[]),
  ('aic-approved-tools', 'ethics-and-ai', array['ai-policy']::text[], array[]::text[]),
  ('aic-vendor-terms', 'ethics-and-ai', array['ai-vendor-terms']::text[], array[]::text[]),
  ('aic-client-consent', 'ethics-and-ai', array['ai-client-consent']::text[], array['professional-judgment']::text[]),
  ('aic-incident-path', 'ethics-and-ai', array['ai-incident']::text[], array['professional-judgment']::text[]),
  ('aic-records', 'ethics-and-ai', array['ai-records']::text[], array[]::text[]),
  ('aic-supervision', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('my-aic-approved-tools', 'ethics-and-ai', array['ai-policy']::text[], array[]::text[]),
  ('my-aic-vendor-terms', 'ethics-and-ai', array['ai-vendor-terms']::text[], array[]::text[]),
  ('my-aic-incident-path', 'ethics-and-ai', array['ai-incident']::text[], array['professional-judgment']::text[]),
  ('my-aic-records', 'ethics-and-ai', array['ai-records']::text[], array[]::text[]),
  ('my-aic-supervision', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('ai-confidentiality-public-tool', 'ethics-and-ai', array['ai-confidentiality']::text[], array['professional-judgment']::text[]),
  ('ai-fabricated-citation', 'ethics-and-ai', array['ai-verification']::text[], array['professional-judgment']::text[]),
  ('ai-duty-to-court-paramount', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('ai-disclosure-to-court', 'ethics-and-ai', array['ai-candour']::text[], array['professional-judgment']::text[]),
  ('ai-affidavit-prohibition', 'ethics-and-ai', array['ai-candour', 'affidavits']::text[], array[]::text[]),
  ('ai-privilege-third-party', 'ethics-and-ai', array['ai-privilege']::text[], array[]::text[]),
  ('ai-competence-obligation', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('ai-billing-time', 'ethics-and-ai', array['ai-billing']::text[], array['professional-judgment']::text[]),
  ('ai-advice-is-yours', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('ai-correcting-the-record', 'ethics-and-ai', array['ai-candour']::text[], array['professional-judgment']::text[]),
  ('my-ai-confidentiality', 'ethics-and-ai', array['ai-confidentiality']::text[], array['professional-judgment']::text[]),
  ('my-ai-fabricated-citation', 'ethics-and-ai', array['ai-verification']::text[], array['professional-judgment']::text[]),
  ('my-ai-bar-council-guidance', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('my-ai-responsibility', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('my-ai-firm-policy', 'ethics-and-ai', array['ai-policy']::text[], array['professional-judgment']::text[]),
  ('my-ai-competence', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('my-ai-jurisdiction-drift', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('my-ai-correcting-the-record', 'ethics-and-ai', array['ai-candour']::text[], array['professional-judgment']::text[]),
  ('my-bas-what-is-a-hierarchy', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('my-bas-what-is-an-appeal', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('my-bas-binding', 'legal-reasoning', array['stare-decisis']::text[], array[]::text[]),
  ('my-bas-two-high-courts-basic', 'court-system', array['my-court-structure']::text[], array[]::text[]),
  ('my-bas-syariah-basic', 'court-system', array['syariah-courts']::text[], array[]::text[]),
  ('my-bas-jurisdiction', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('my-bas-first-instance', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('my-bas-parties', 'court-system', array['court-terminology']::text[], array[]::text[]);

  update public.questions q
  set domain_id = d.id
  from relabel_0035 l
  join public.domains d on d.slug = l.domain
  where q.slug = l.slug
    and q.domain_id is distinct from d.id;

  delete from public.question_concepts qc
  using public.questions q, relabel_0035 l
  where qc.question_id = q.id
    and q.slug = l.slug;

  insert into public.question_concepts (question_id, concept_id)
  select q.id, c.id
  from relabel_0035 l
  join public.questions q on q.slug = l.slug
  cross join lateral unnest(l.concepts) as wanted(slug)
  join public.concepts c on c.slug = wanted.slug;

  delete from public.question_skills qs
  using public.questions q, relabel_0035 l
  where qs.question_id = q.id
    and q.slug = l.slug;

  insert into public.question_skills (question_id, skill_id)
  select q.id, s.id
  from relabel_0035 l
  join public.questions q on q.slug = l.slug
  cross join lateral unnest(l.skills) as wanted(slug)
  join public.skills s on s.slug = wanted.slug;

  drop table relabel_0035;
end
$$;


-- >>> 0036_third_audit.sql ----------------------------------------

-- =============================================================================
-- The third audit: what the database still allowed that the app never does
-- =============================================================================
-- 1. A coach could delete a session, a certification trainee (and with it
--    every graded entry) or a work post by calling the database directly,
--    because each table had one "for all" policy for coaches. The app never
--    deletes any of them: a session is taken down by unpublishing, a graded
--    entry is corrected in place. Writes are now insert and update only.
-- 2. A work post's file could be pointed at any object in the bucket,
--    including an intern's handed-in work, which the app would then sign a
--    link to for everybody who can see the post. A post's files now have to
--    sit in that post's own folder.
-- 3. A learner could set their matter recording's path to anybody's file,
--    which the server would then sign. It now has to be under their own
--    folder and that attempt.
-- 4. A learner could set their photo to any address on the internet, which
--    every coach opening Admin, Trainees would then load. It now has to be
--    their own file in the avatars bucket.
-- 5. Scores by area were added up per concept, so a question tagged with
--    three concepts counted three times. area_scores counts answers, once
--    each, by the question's own area: the share of answers that were right,
--    as the pages say. Server only.
-- =============================================================================

-- 1. No deletes by coaches ----------------------------------------------------

drop policy if exists coach_sessions_write on public.coach_sessions;
drop policy if exists coach_sessions_insert on public.coach_sessions;
create policy coach_sessions_insert on public.coach_sessions
  for insert to authenticated with check (public.is_coach());
drop policy if exists coach_sessions_update on public.coach_sessions;
create policy coach_sessions_update on public.coach_sessions
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- The register had no read policy of its own: "for all" covered reading
-- too. Coaches keep reading it.
drop policy if exists certification_trainees_read on public.certification_trainees;
create policy certification_trainees_read on public.certification_trainees
  for select to authenticated using (public.is_coach());
drop policy if exists certification_entries_read on public.certification_entries;
create policy certification_entries_read on public.certification_entries
  for select to authenticated using (public.is_coach());

drop policy if exists certification_trainees_write on public.certification_trainees;
drop policy if exists certification_trainees_insert on public.certification_trainees;
create policy certification_trainees_insert on public.certification_trainees
  for insert to authenticated with check (public.is_coach());
drop policy if exists certification_trainees_update on public.certification_trainees;
create policy certification_trainees_update on public.certification_trainees
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

drop policy if exists certification_entries_write on public.certification_entries;
drop policy if exists certification_entries_insert on public.certification_entries;
create policy certification_entries_insert on public.certification_entries
  for insert to authenticated with check (public.is_coach());
drop policy if exists certification_entries_update on public.certification_entries;
create policy certification_entries_update on public.certification_entries
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

drop policy if exists work_posts_write on public.work_posts;
drop policy if exists work_posts_insert on public.work_posts;
create policy work_posts_insert on public.work_posts
  for insert to authenticated with check (public.is_coach());
drop policy if exists work_posts_update on public.work_posts;
create policy work_posts_update on public.work_posts
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- 2. A post's files live in its own folder -------------------------------------

alter table public.work_posts drop constraint if exists work_posts_files_own_folder;
alter table public.work_posts add constraint work_posts_files_own_folder check (
  (file_path is null or file_path like 'posts/' || id::text || '/%')
  and (memo_path is null or memo_path like 'posts/' || id::text || '/%')
);

-- 3. A recording lives under its own learner and attempt -----------------------

alter table public.matter_attempts drop constraint if exists matter_attempts_recording_own_folder;
alter table public.matter_attempts add constraint matter_attempts_recording_own_folder check (
  recording_path is null
  or recording_path ~ ('^' || user_id::text || '/' || id::text || '/[0-9]+\.[a-z0-9]+$')
);

-- 4. A photo is your own file in the avatars bucket ----------------------------

alter table public.profiles drop constraint if exists profiles_avatar_own_file;
alter table public.profiles add constraint profiles_avatar_own_file check (
  avatar_url is null
  or avatar_url like '%/storage/v1/object/public/avatars/' || id::text || '/%'
);

-- 5. Scores by area, one count per answer --------------------------------------

create or replace function public.area_scores(uid uuid)
returns table (domain_id uuid, answered integer, right_answers integer)
language sql
stable
set search_path = public
as $$
  select q.domain_id,
         count(*)::integer,
         (count(*) filter (where a.is_correct))::integer
  from public.user_question_attempts a
  join public.questions q on q.id = a.question_id
  where a.user_id = uid
  group by q.domain_id
$$;

revoke all on function public.area_scores(uuid) from public;
revoke all on function public.area_scores(uuid) from anon;
revoke all on function public.area_scores(uuid) from authenticated;
grant execute on function public.area_scores(uuid) to service_role;


-- >>> 0038_jurisdiction_and_tutor.sql -----------------------------

-- =============================================================================
-- Each country's law reaches only that country's learners
-- =============================================================================
-- Australian and Malaysian law are kept strictly apart: a rule from the wrong
-- one is not merely irrelevant, it is wrong. The app already filters by the
-- learner's country, but two doors in the database did not:
--
-- 1. v_question_delivery showed every published question, from both
--    countries, to anybody signed in. The app reads it with the service role,
--    so it never relied on that; a learner calling the database directly
--    could read the other country's bank. It now shows a learner only their
--    own country's questions. Staff and the service role still see both.
-- 2. The daily facts read policy was "published", with no country, so the
--    same was true of the daily brief. It now checks the learner's country
--    too, and staff still pass.
--
-- The view keeps its body from 0004 and only gains the condition, so its
-- columns, its grants and everything that reads it are unchanged.
-- =============================================================================

-- The caller's own country. SECURITY DEFINER for the same reason is_coach()
-- is: a policy calls it, and it must not depend on the caller being able to
-- read their own profile through that table's RLS.
create or replace function public.caller_country()
returns country
language sql
stable
security definer
set search_path = public
as $$
  select p.country from public.profiles p where p.id = auth.uid();
$$;

revoke all on function public.caller_country() from public;
grant execute on function public.caller_country() to authenticated, service_role;

-- 1. The delivery view ---------------------------------------------------------

-- A definer view runs as its owner, but current_user inside it is still the
-- caller, which is how the service role is told apart from a learner here.
create or replace view public.v_question_delivery
with (security_invoker = false) as
select
  q.id                as question_id,
  q.slug,
  q.country,
  q.domain_id,
  d.slug              as domain_slug,
  d.name              as domain_name,
  qv.id               as question_version_id,
  qv.version,
  qv.question_type,
  qv.scenario,
  qv.stem,
  qv.options,
  qv.difficulty,
  qv.jurisdiction,
  qv.court
from public.questions q
join public.question_versions qv
  on qv.question_id = q.id and qv.is_current
join public.domains d on d.id = q.domain_id
where q.status = 'published'
  and (
    current_user in ('service_role', 'postgres', 'supabase_admin')
    or public.is_coach()
    or q.country = public.caller_country()
  );

revoke all on public.v_question_delivery from anon, authenticated;
grant select on public.v_question_delivery to authenticated;

comment on view public.v_question_delivery is
  'Questions as a learner may see them: no answer key, no explanation, and only '
  'their own country''s. Staff and the service role see both countries. Country '
  'is carried so a session can be filtered to one legal system without joining '
  'back to a table learners cannot read.';

-- 2. The daily brief -----------------------------------------------------------

drop policy if exists daily_facts_read_published on public.daily_facts;
create policy daily_facts_read_published on public.daily_facts
  for select to authenticated using (
    status = 'published'
    and (public.is_coach() or country = public.caller_country())
  );

