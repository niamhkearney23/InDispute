-- =============================================================================
-- A separate set of diagnostic questions
-- =============================================================================
-- The owner, November 2026: "can the diagnostic questions be totally
-- different from the learning and other questions?" They shared one bank, so
-- the diagnostic asked the questions a module then counted as done, and an
-- easy bank made an easy diagnostic.
--
-- A question can now be for the diagnostic only. The app's training, modules
-- and reviews never serve one; the diagnostic draws on them alone once there
-- are enough published for a country, and on the whole bank until then.
-- Nothing else about a question changes: it is written, signed off and
-- published exactly as before, and the publication gate (0044) and the
-- content-expiry rules (0051, 0052) apply to it the same.
--
-- Who may set it is unchanged too: questions are written through the server
-- only (0040), and learners read them only through the view below.

alter table public.questions
  add column if not exists diagnostic_only boolean not null default false;

comment on column public.questions.diagnostic_only is
  'Asked only in the diagnostic; never in daily training, modules or reviews.';

-- The delivery view as 0051 left it, with the flag added at the end (a view
-- may gain columns only at the end).
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
  qv.court,
  q.diagnostic_only
from public.questions q
join public.question_versions qv
  on qv.question_id = q.id and qv.is_current
join public.domains d on d.id = q.domain_id
where q.status = 'published'
  and qv.verification_status = 'human_verified'
  and (qv.review_due_on is null or qv.review_due_on > current_date)
  and (
    current_user in ('service_role', 'postgres', 'supabase_admin')
    or public.is_coach()
    or q.country = public.caller_country()
  );
