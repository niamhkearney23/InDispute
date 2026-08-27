-- =============================================================================
-- Lawgistics Academy: update an existing database
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
-- and typed in a start date. That is not "everyone joins through Lawgistics",
-- it is "everyone joins, and then Lawgistics finds out".
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

