-- =============================================================================
-- A sign-off, a mark and a hand-in mean what they say
-- =============================================================================
-- A fourth audit tried each record a firm relies on through the public API,
-- with an ordinary sign-in token, and found these.
--
-- 1. An administrator could write question versions, daily facts, questions
--    and invitations directly. Each had one "for all" policy, so an
--    administrator could put somebody else's name on a sign-off and backdate
--    it, empty "who wrote this" and then sign off their own words, rewrite a
--    signed-off explanation or fact and keep the sign-off, or delete a
--    signed-off fact. Every write the app makes to these tables goes through
--    the server with the service role, after the role is checked, so the
--    policies now only read. Triggers hold the rules for every caller,
--    the server included: new words clear the sign-off, the writer cannot be
--    emptied, and a sign-off is dated by the database.
--
-- 2. A coach could mark their own hand-in, on the work board or on a matter,
--    and five matters they marked Good themselves issued a certificate.
--
-- 3. Question versions carry an "updated at", so the review card can say
--    which words the reviewer read and the sign-off lands only on those.
--
-- 4. A learner could declare homework for a day that had not come yet by
--    writing directly. The server writes it now, after its own checks.
--
-- 5. The first-run page granted administrator rights with a check and a
--    write, so two people pressing it together could both be made one. One
--    function now does both under a lock.
--
-- 6. A matter could be handed in empty by writing directly.
--
-- 7. A learner could clear "choose your own password" without choosing one.
-- =============================================================================

-- 1. Sign-offs ------------------------------------------------------------------

drop policy if exists questions_admin on public.questions;
drop policy if exists questions_admin_read on public.questions;
create policy questions_admin_read on public.questions
  for select to authenticated using (public.is_admin());

drop policy if exists question_versions_admin on public.question_versions;
drop policy if exists question_versions_admin_read on public.question_versions;
create policy question_versions_admin_read on public.question_versions
  for select to authenticated using (public.is_admin());

-- Learners keep reading the published pool through daily_facts_read_published.
drop policy if exists daily_facts_admin on public.daily_facts;
drop policy if exists daily_facts_admin_read on public.daily_facts;
create policy daily_facts_admin_read on public.daily_facts
  for select to authenticated using (public.is_admin());

drop policy if exists joiner_invitations_admin on public.joiner_invitations;
drop policy if exists joiner_invitations_admin_read on public.joiner_invitations;
create policy joiner_invitations_admin_read on public.joiner_invitations
  for select to authenticated using (public.is_admin());

-- The policies already refuse these; the rights go too, so a policy added by
-- mistake later does not quietly reopen them. Truncate ignores policies.
revoke insert, update, delete, truncate on public.questions from anon, authenticated;
revoke insert, update, delete, truncate on public.question_versions from anon, authenticated;
revoke insert, update, delete, truncate on public.daily_facts from anon, authenticated;
revoke insert, update, delete, truncate on public.joiner_invitations from anon, authenticated;

-- Which words the reviewer read. Touched on every change, so the server can
-- make a sign-off conditional on it in the same statement.
alter table public.question_versions
  add column if not exists updated_at timestamptz not null default now();

create or replace trigger question_versions_touch
  before update on public.question_versions
  for each row execute function public.touch_updated_at();

-- One guard for both tables. The trigger's arguments are the columns a
-- sign-off covers on that table; the stem, options and answer of a question
-- are frozen already, so a version only lists what can change in place.
--
-- Not security definer: it has to see the caller in current_user. The
-- service role and the database owner are the server and the migrations; an
-- authenticated caller is somebody with a sign-in token.
create or replace function public.guard_signoff()
returns trigger language plpgsql set search_path = public as $$
declare
  server boolean := current_user in ('service_role', 'postgres', 'supabase_admin');
  was jsonb;
  now_is jsonb;
  col text;
  reworded boolean := false;
  signing boolean;
begin
  if tg_op = 'UPDATE' then
    -- Who wrote it is what stops them signing it off. It empties only when
    -- the account itself is removed, which is the foreign key doing it.
    if old.created_by is not null and new.created_by is null
       and (not server or exists (select 1 from auth.users u where u.id = old.created_by)) then
      raise exception 'Who wrote this is part of the record and cannot be cleared';
    end if;

    was := to_jsonb(old);
    now_is := to_jsonb(new);
    foreach col in array tg_argv loop
      if now_is -> col is distinct from was -> col then
        reworded := true;
      end if;
    end loop;

    -- A sign-off was a statement about the words that were there. New words
    -- have not been signed off by anybody, whatever the request said.
    if reworded then
      if new.verification_status = 'human_verified' then
        new.verification_status := 'requires_review';
      end if;
      new.verified_by := null;
      new.verified_at := null;
      new.review_due_on := null;
      if old.verification_status = 'human_verified' then
        if tg_table_name = 'daily_facts' then
          if new.status = 'verified' then
            new.status := 'requires_review';
          end if;
        elsif new.is_current then
          update public.questions set status = 'requires_review'
          where id = new.question_id and status = 'verified';
        end if;
      end if;
      return new;
    end if;
  end if;

  -- Giving a sign-off: a new name, or the status coming back to verified.
  signing := new.verified_by is not null and (
    tg_op = 'INSERT'
    or new.verified_by is distinct from old.verified_by
    or (new.verification_status = 'human_verified'
        and old.verification_status is distinct from 'human_verified')
  );

  if signing then
    -- Through the API the name on a sign-off is the person signed in. The
    -- server signs for the coach whose session it checked, and names them.
    if not server and new.verified_by is distinct from auth.uid() then
      raise exception 'A sign-off is in the name of the person giving it';
    end if;
    new.verified_at := now();
  elsif not server and new.verification_status = 'human_verified'
        and (tg_op = 'INSERT' or old.verification_status is distinct from 'human_verified') then
    raise exception 'A sign-off is in the name of the person giving it';
  elsif tg_op = 'UPDATE' then
    -- No new sign-off, so its date stays as it was, or goes with the name.
    new.verified_at := case when new.verified_by is null then null else old.verified_at end;
  elsif new.verified_by is null then
    new.verified_at := null;
  end if;
  return new;
end;
$$;

-- Named to run after the freeze and before the expiry stamp, which then
-- clears the expiry of anything this took the sign-off from.
create or replace trigger question_versions_guard_signoff
  before insert or update on public.question_versions
  for each row execute function public.guard_signoff(
    'explanation', 'why_it_matters', 'common_misconception', 'memory_trick',
    'source_id', 'source_reference', 'source_url', 'source_checked_on'
  );

create or replace trigger daily_facts_guard_signoff
  before insert or update on public.daily_facts
  for each row execute function public.guard_signoff(
    'title', 'body', 'why_it_matters', 'jurisdiction'
  );

-- 2. Nobody marks their own work ---------------------------------------------------
-- Any self-mark already there is cleared first, so the rule can be checked
-- against every row rather than added "not valid", which would freeze those
-- rows (see 0024). Under this rule they were never marks: the work goes back
-- to waiting for a coach, and a certificate already issued is left alone.
update public.work_submissions
set verdict = null, feedback = '', marked_by = null
where marked_by is not null and marked_by = user_id;

update public.matter_attempts
set verdict = null, feedback = '', marked_by = null
where marked_by is not null and marked_by = user_id;

alter table public.work_submissions drop constraint if exists work_submissions_not_self_marked;
alter table public.work_submissions
  add constraint work_submissions_not_self_marked check (marked_by is null or marked_by <> user_id);

alter table public.matter_attempts drop constraint if exists matter_attempts_not_self_marked;
alter table public.matter_attempts
  add constraint matter_attempts_not_self_marked check (marked_by is null or marked_by <> user_id);

-- 4. Homework is declared through the server --------------------------------------
-- The server checks the day has come round before writing. Learners still
-- read their own through homework_declarations_select_own.
drop policy if exists homework_declarations_insert_own on public.homework_declarations;
revoke insert on public.homework_declarations from anon, authenticated;

-- 5. One first administrator ------------------------------------------------------
-- The check and the grant in one call, under a lock, so two people pressing
-- the first-run button at once cannot both come away an administrator. True
-- when this call made them one. The server alone may call it.
create or replace function public.claim_first_admin(uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('public.claim_first_admin'));
  if exists (select 1 from public.profiles where is_admin) then
    return false;
  end if;
  update public.profiles set is_admin = true where id = uid;
  return found;
end;
$$;

revoke all on function public.claim_first_admin(uuid) from public;
revoke all on function public.claim_first_admin(uuid) from anon;
revoke all on function public.claim_first_admin(uuid) from authenticated;
grant execute on function public.claim_first_admin(uuid) to service_role;

-- 6. A hand-in has its parts ------------------------------------------------------
-- The same rule as missingForHandIn in src/lib/matters/rules.ts: the
-- procedure, the advice, the follow-up questions asked, and an answer to
-- every one of them. Text counts when it has something other than spaces.
-- Redefined whole from its 0039 body, which also freezes the recording's
-- declaration at hand-in.
create or replace function public.guard_matter_attempt()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.matter_id is distinct from old.matter_id
     or new.user_id is distinct from old.user_id
     or new.started_at is distinct from old.started_at
     or new.deadline_at is distinct from old.deadline_at
     or new.snapshot is distinct from old.snapshot then
    raise exception 'An attempt keeps the matter, the person and the clock it started with';
  end if;

  if old.submitted_at is not null then
    if new.procedure_answer is distinct from old.procedure_answer
       or new.draft_answer is distinct from old.draft_answer
       or new.recording_path is distinct from old.recording_path
       or new.recording_seconds is distinct from old.recording_seconds
       or new.recording_declared_clean is distinct from old.recording_declared_clean
       or new.followup_questions is distinct from old.followup_questions
       or new.followup_answers is distinct from old.followup_answers
       or new.followups_by_ai is distinct from old.followups_by_ai
       or new.followups_asked_at is distinct from old.followups_asked_at
       or new.submitted_at is distinct from old.submitted_at
       or new.submitted_late is distinct from old.submitted_late then
      raise exception 'What was handed in is not changed afterwards';
    end if;
  elsif new.submitted_at is not null then
    if new.procedure_answer !~ '\S'
       or new.draft_answer !~ '\S'
       or jsonb_typeof(new.followup_questions) is distinct from 'array'
       or jsonb_array_length(new.followup_questions) = 0
       or jsonb_typeof(new.followup_answers) is distinct from 'array'
       or exists (
         select 1
         from generate_series(0, jsonb_array_length(new.followup_questions) - 1) i
         where coalesce(new.followup_answers ->> i, '') !~ '\S'
       ) then
      raise exception 'A matter is handed in with the procedure, the advice and an answer to every follow-up question';
    end if;
    new.submitted_at := now();
    new.submitted_late := now() > old.deadline_at;
  end if;

  if new.verdict is distinct from old.verdict or new.feedback is distinct from old.feedback then
    if old.submitted_at is null then
      raise exception 'Only an attempt that has been handed in can be marked';
    end if;
    new.marked_at := now();
  end if;
  return new;
end;
$$;

-- 7. Choosing your own password ---------------------------------------------------
-- The flag comes off when the server has seen the new password saved, never
-- because a request asked. Everything else is as 0024 left it.
create or replace function public.guard_profile_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and old.must_change_password and not new.must_change_password
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    new.must_change_password := true;
  end if;

  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Only reachable where the signup trigger did not make the row. Nothing
    -- the firm decides may arrive with it.
    new.starts_on := null;
    new.ends_on := null;
    new.must_change_password := false;
    new.diagnostic_completed_at := null;
    new.created_at := now();
    return new;
  end if;

  new.email := old.email;
  new.created_at := old.created_at;
  -- Set by the server when the diagnostic is finished, not by the learner.
  new.diagnostic_completed_at := old.diagnostic_completed_at;
  -- Nor may a person set "choose your own password" on themselves.
  if new.must_change_password and not old.must_change_password then
    new.must_change_password := false;
  end if;
  return new;
end;
$$;
