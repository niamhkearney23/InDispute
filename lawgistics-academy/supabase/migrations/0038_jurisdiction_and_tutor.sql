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
