-- =============================================================================
-- Review workflow
-- =============================================================================
-- Verification was already a yes/no: a version is human_verified or it is not.
-- That is too blunt for the job it has to do. Reviewing legal content produces
-- three outcomes, not two:
--
--   * this is correct                    -> verified
--   * this is wrong or needs a change    -> flagged, with a note saying what
--   * this should not exist              -> retired
--
-- Without somewhere to record the middle case, a reviewer working through a
-- hundred items has nowhere to put "the rule number is wrong" except a separate
-- document that immediately drifts out of step with the bank.
--
-- The note lives on the version, not the question, for the same reason
-- verification does: rewriting the content must not silently inherit a review
-- of different words.
-- =============================================================================

alter table public.question_versions
  add column review_note   text,
  add column review_flagged boolean not null default false,
  add column reviewed_by   uuid references auth.users (id) on delete set null,
  add column reviewed_at   timestamptz;

alter table public.daily_facts
  add column review_note   text,
  add column review_flagged boolean not null default false,
  add column reviewed_by   uuid references auth.users (id) on delete set null,
  add column reviewed_at   timestamptz;

-- The review queue reads "everything not yet signed off", newest flags first.
create index question_versions_review_queue_idx
  on public.question_versions (verification_status, review_flagged)
  where is_current;

create index daily_facts_review_queue_idx
  on public.daily_facts (verification_status, review_flagged);

-- A flagged item must not be servable, whatever its status was. This is the
-- one rule worth enforcing in the database rather than the application: a
-- reviewer flagging something as wrong should take it out of circulation
-- immediately, without depending on the UI to remember to do it.
create or replace function public.withdraw_flagged_question()
returns trigger language plpgsql as $$
begin
  if new.review_flagged and not coalesce(old.review_flagged, false) then
    update public.questions
    set status = 'requires_review'
    where id = new.question_id and status = 'published';
  end if;
  return new;
end;
$$;

create trigger question_versions_withdraw_flagged
  after update on public.question_versions
  for each row execute function public.withdraw_flagged_question();

create or replace function public.withdraw_flagged_fact()
returns trigger language plpgsql as $$
begin
  if new.review_flagged and not coalesce(old.review_flagged, false)
     and new.status = 'published' then
    new.status := 'requires_review';
  end if;
  return new;
end;
$$;

create trigger daily_facts_withdraw_flagged
  before update on public.daily_facts
  for each row execute function public.withdraw_flagged_fact();
