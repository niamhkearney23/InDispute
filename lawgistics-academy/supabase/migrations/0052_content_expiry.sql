-- =============================================================================
-- A sign-off that runs out goes back to the review queue, with a record of it
-- =============================================================================
-- The owner, October 2026, before staging: "Expired content should
-- automatically return to the appropriate review queue. Preserve historical
-- learner answers and audit records without making withdrawn content
-- available to new learners."
--
-- Since 0051 a question or daily fact past its `review_due_on` is no longer
-- given out, but it stayed marked `human_verified` and published until a
-- person noticed. `return_lapsed_content()` now takes every such item back:
--
--   * It first writes what the sign-off was to `content_lapses` (who signed,
--     when, the date it ran out), because clearing the sign-off clears those
--     columns on the item itself. The record is insert-only, for everybody.
--   * Then it clears the sign-off and leaves a note saying why. The
--     publication gates (0044) take the item out of publication in the same
--     statement, so it sits in the review queue as "requires review".
--   * Learners' answers to it are not touched: `user_question_attempts` keeps
--     every answer, pinned to the version answered (and is refused deletion
--     by its own trigger, 0001).
--
-- It runs nightly (`/api/cron/content-review`) and whenever a reviewer opens
-- the review queue or the daily brief list, so the queue is never behind.
-- The service role only. Re-running it is harmless: an item already taken
-- back is no longer signed off, so it is not picked up twice.
-- =============================================================================

create table if not exists public.content_lapses (
  id                  uuid primary key default gen_random_uuid(),
  kind                text not null check (kind in ('question', 'fact')),
  question_id         uuid references public.questions (id) on delete restrict,
  question_version_id uuid references public.question_versions (id) on delete restrict,
  fact_id             uuid references public.daily_facts (id) on delete restrict,
  signed_by           uuid,
  signed_at           timestamptz,
  review_due_on       date not null,
  -- The reviewer's note before the job replaced it with its own.
  previous_review_note text,
  returned_at         timestamptz not null default now(),
  constraint content_lapses_one_item check (
    (kind = 'question' and question_version_id is not null and fact_id is null)
    or (kind = 'fact' and fact_id is not null and question_version_id is null)
  )
);

alter table public.content_lapses enable row level security;
-- No policy for anybody: the server reads it, and only the function writes.
revoke all on public.content_lapses from public, anon, authenticated, service_role;
grant select on public.content_lapses to service_role;

create or replace function public.refuse_lapse_change()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'A record of a lapsed sign-off is kept as it was written.' using errcode = '42501';
end;
$$;
revoke all on function public.refuse_lapse_change() from public;

create or replace trigger content_lapses_kept
  before update or delete on public.content_lapses
  for each row execute function public.refuse_lapse_change();
create or replace trigger content_lapses_no_truncate
  before truncate on public.content_lapses
  for each statement execute function public.refuse_lapse_change();

create or replace function public.return_lapsed_content()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  questions_returned integer;
  facts_returned integer;
begin
  -- Questions: the current version only, since only it is ever given out.
  with lapsed as (
    select qv.id, qv.question_id, qv.verified_by, qv.verified_at, qv.review_due_on, qv.review_note
      from public.question_versions qv
     where qv.is_current
       and qv.verification_status = 'human_verified'
       and qv.review_due_on is not null
       and qv.review_due_on <= current_date
       for update
  ), logged as (
    insert into public.content_lapses
      (kind, question_id, question_version_id, signed_by, signed_at, review_due_on, previous_review_note)
    select 'question', question_id, id, verified_by, verified_at, review_due_on, review_note from lapsed
    returning question_version_id, question_id
  ), unverified as (
    -- Signed off but not yet published: no longer "verified" either.
    update public.questions q set status = 'requires_review'
      from logged where q.id = logged.question_id and q.status = 'verified'
    returning q.id
  )
  update public.question_versions qv
     set verification_status = 'requires_review',
         verified_by = null,
         review_note = 'The sign-off ran out on ' || to_char(qv.review_due_on, 'DD Mon YYYY')
                       || '. Check it again before it goes back to learners.'
    from logged
   where qv.id = logged.question_version_id;
  get diagnostics questions_returned = row_count;

  with lapsed as (
    select f.id, f.verified_by, f.verified_at, f.review_due_on, f.review_note
      from public.daily_facts f
     where f.verification_status = 'human_verified'
       and f.review_due_on is not null
       and f.review_due_on <= current_date
       for update
  ), logged as (
    insert into public.content_lapses (kind, fact_id, signed_by, signed_at, review_due_on, previous_review_note)
    select 'fact', id, verified_by, verified_at, review_due_on, review_note from lapsed
    returning fact_id
  )
  update public.daily_facts f
     set verification_status = 'requires_review',
         status = case when f.status = 'verified' then 'requires_review' else f.status end,
         verified_by = null,
         review_note = 'The sign-off ran out on ' || to_char(f.review_due_on, 'DD Mon YYYY')
                       || '. Check it again before it goes back to learners.'
    from logged
   where f.id = logged.fact_id;
  get diagnostics facts_returned = row_count;

  return jsonb_build_object('questions', questions_returned, 'facts', facts_returned);
end;
$$;

revoke all on function public.return_lapsed_content() from public, anon, authenticated;
grant execute on function public.return_lapsed_content() to service_role;

-- -----------------------------------------------------------------------------
-- Answering: claimed only against content approved at that moment
-- -----------------------------------------------------------------------------
-- The server used to ask "is this still offered?" and then, separately, claim
-- the slot and read the answer key, so a withdrawal landing in between could
-- still see the key sent. Now one transaction locks the slot, holds the
-- question and its versions still (a withdrawal, an unpublish or a new
-- version waits for it, or it sees them), closes the slot, asks the delivery
-- view, and hands back the version as it was at that moment, the answer key
-- and explanation only when it is still offered. The caller is the server,
-- which names the learner whose session it checked.
create or replace function public.claim_answer(p_session uuid, p_version uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  slot_id uuid;
  question uuid;
  v public.question_versions%rowtype;
begin
  select tsq.id, tsq.question_id into slot_id, question
    from public.training_session_questions tsq
    join public.training_sessions s on s.id = tsq.session_id
   where tsq.session_id = p_session
     and tsq.question_version_id = p_version
     and s.user_id = p_user
     and s.status = 'in_progress'
     and tsq.answered_at is null
     for update of tsq;
  if slot_id is null then
    return jsonb_build_object('result', 'unavailable');
  end if;

  perform 1 from public.questions where id = question for share;
  perform 1 from public.question_versions where question_id = question for share;
  update public.training_session_questions set answered_at = now() where id = slot_id;

  select * into v from public.question_versions where id = p_version;
  if not exists (select 1 from public.v_question_delivery where question_version_id = p_version) then
    return jsonb_build_object('result', 'withdrawn', 'slot_id', slot_id, 'jurisdiction', v.jurisdiction);
  end if;
  return jsonb_build_object(
    'result', 'offered',
    'slot_id', slot_id,
    'version', jsonb_build_object(
      'id', v.id, 'question_id', v.question_id, 'correct_option_ids', v.correct_option_ids,
      'explanation', v.explanation, 'why_it_matters', v.why_it_matters,
      'common_misconception', v.common_misconception, 'memory_trick', v.memory_trick,
      'difficulty', v.difficulty, 'jurisdiction', v.jurisdiction, 'court', v.court,
      'source_reference', v.source_reference, 'source_url', v.source_url,
      'verification_status', v.verification_status, 'review_due_on', v.review_due_on));
end;
$$;

revoke all on function public.claim_answer(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_answer(uuid, uuid, uuid) to service_role;

-- Anything already past its date when this runs goes back now.
select public.return_lapsed_content();
