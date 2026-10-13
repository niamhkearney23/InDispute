-- =============================================================================
-- Nothing reaches a learner until a lawyer has signed it off
-- =============================================================================
-- Loading the content published the Australian questions and daily facts
-- straight away, still marked as needing review, so that a new install had a
-- working training loop. The Malaysian bank was always held back. That left
-- Australian learners answering questions no lawyer had checked, with
-- nothing on the screen to say so, which breaks the rule the product stands
-- on: legal content is published only once a named lawyer has signed it off.
--
-- The rule now holds in the database, for both countries:
--
-- 1. Anything published without a sign-off is taken back to review. It is
--    not marked as withdrawn, so "put everything back" cannot republish it.
-- 2. Learners receive questions and daily facts only when the current
--    wording carries a lawyer's sign-off, whatever the status says. The
--    delivery view and the daily brief's read policy both check it.
-- 3. Publishing something without a sign-off is refused. Content that loses
--    its sign-off while published (its wording or source changed) is taken
--    back to review in the same statement.
-- =============================================================================

-- 1. Take back what was published unsigned --------------------------------------

update public.questions q
   set status = 'requires_review'
 where q.status = 'published'
   and not exists (
     select 1 from public.question_versions v
      where v.question_id = q.id and v.is_current and v.verification_status = 'human_verified'
   );

update public.daily_facts
   set status = 'requires_review'
 where status = 'published'
   and verification_status is distinct from 'human_verified';

-- 2. Learners receive only signed-off content -----------------------------------
-- The view is redefined whole from its 0038 body, with the sign-off added.

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
  and qv.verification_status = 'human_verified'
  and (
    current_user in ('service_role', 'postgres', 'supabase_admin')
    or public.is_coach()
    or q.country = public.caller_country()
  );

drop policy if exists daily_facts_read_published on public.daily_facts;
create policy daily_facts_read_published on public.daily_facts
  for select to authenticated using (
    status = 'published'
    and verification_status = 'human_verified'
    and (public.is_coach() or country = public.caller_country())
  );

-- 3. Publishing needs a sign-off ------------------------------------------------

create or replace function public.question_publish_gate()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not exists (
       select 1 from public.question_versions v
        where v.question_id = new.id and v.is_current and v.verification_status = 'human_verified'
     ) then
    raise exception 'A question is published only once a lawyer has signed off its current wording';
  end if;
  return new;
end;
$$;

create or replace trigger questions_publish_gate
  before insert or update of status on public.questions
  for each row execute function public.question_publish_gate();

-- A question whose current wording is not signed off does not stay
-- published: a new version, or a sign-off cleared by a change of wording,
-- takes it back to review in the same statement.
create or replace function public.question_version_publish_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_current and new.verification_status is distinct from 'human_verified' then
    update public.questions
       set status = 'requires_review'
     where id = new.question_id and status = 'published';
  end if;
  return null;
end;
$$;

revoke all on function public.question_version_publish_gate() from public;

-- Fires on every update, not only on updates that name these columns: a
-- sign-off cleared by guard_signoff (a corrected explanation) changes
-- verification_status without the statement naming it, and a trigger "of"
-- columns would never see it.
create or replace trigger question_versions_publish_gate
  after insert or update on public.question_versions
  for each row execute function public.question_version_publish_gate();

-- Named to sort after daily_facts_guard_signoff (0040), so it sees a sign-off
-- that a change of wording has just cleared.
create or replace function public.fact_publish_gate()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'published' and new.verification_status is distinct from 'human_verified' then
    if tg_op = 'UPDATE' and old.status = 'published' then
      new.status := 'requires_review';
    else
      raise exception 'A daily fact is published only once a lawyer has signed it off';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger daily_facts_publish_gate
  before insert or update on public.daily_facts
  for each row execute function public.fact_publish_gate();
