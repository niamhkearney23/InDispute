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
