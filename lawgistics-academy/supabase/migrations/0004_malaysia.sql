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
