-- =============================================================================
-- Firm reports: who was active in which month
-- =============================================================================
-- A firm is invoiced on the number of its people who were active in a month,
-- so the figure has to be one a firm can check: somebody counts for a month
-- when they answered a question, ticked a day's homework, handed in work or
-- started a practice matter in it. Logging in and looking around does not
-- count.
--
-- Counted in the database, once per person per month, because counting raw
-- answers in the app stops at the thousand rows a request returns (see 0034).
-- Months are calendar months on the firm's clock, passed in as a timezone.
-- Service role only: the report page has checked the caller is the firm's
-- administrator, and it passes the people the firm supervises.
-- =============================================================================

create or replace function public.firm_activity(
  ids uuid[],
  since timestamptz,
  until timestamptz,
  zone text default 'Asia/Kuala_Lumpur'
)
returns table (user_id uuid, month date)
language sql
stable
set search_path = public
as $$
  select distinct x.user_id, date_trunc('month', x.at at time zone zone)::date
  from (
    select a.user_id, a.answered_at as at
      from public.user_question_attempts a
     where a.user_id = any (ids) and a.answered_at >= since and a.answered_at < until
    union all
    select h.user_id, h.declared_at
      from public.homework_declarations h
     where h.user_id = any (ids) and h.declared_at >= since and h.declared_at < until
    union all
    select s.user_id, s.submitted_at
      from public.work_submissions s
     where s.user_id = any (ids) and s.submitted_at >= since and s.submitted_at < until
    union all
    select m.user_id, m.started_at
      from public.matter_attempts m
     where m.user_id = any (ids) and m.started_at >= since and m.started_at < until
  ) x
$$;

revoke all on function public.firm_activity(uuid[], timestamptz, timestamptz, text) from public;
revoke all on function public.firm_activity(uuid[], timestamptz, timestamptz, text) from anon;
revoke all on function public.firm_activity(uuid[], timestamptz, timestamptz, text) from authenticated;
grant execute on function public.firm_activity(uuid[], timestamptz, timestamptz, text) to service_role;
