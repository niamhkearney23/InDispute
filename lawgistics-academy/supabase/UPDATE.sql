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

