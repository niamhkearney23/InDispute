-- =============================================================================
-- Closing the doors the app never uses
-- =============================================================================
-- An audit read every policy against what the app actually does, and found
-- places where the database allowed more than any page ever asks for. None
-- of them is reachable by pressing a button. All of them are reachable by
-- somebody who takes their own sign-in token to the public API, and the
-- record a firm relies on is only as good as the least guarded way in.
--
-- 1. A learner's training record was theirs to write. Sessions, mastery,
--    review dates, streaks and diagnostic results all had "for all"
--    policies, and attempts had an insert policy, although every write the
--    app makes to them goes through the server with the service role. So a
--    learner could set every mastery score to 100, rewrite the diagnostic a
--    firm compares against, or add a question of their choosing to their own
--    session and be told its answer. Learners now read these and nothing
--    else. The server writes them, as it always has.
--
-- 2. A piece of work could be handed in already marked. The insert policy
--    checked who and which post, not the marking columns, so an intern could
--    submit with verdict 'good' and a coach's name on it. Marking columns are
--    now cleared on the way in, and a mark records the person who made it
--    and the moment they made it, never a value from the request. The file
--    path must be the intern's own folder for that post, so a row cannot
--    name somebody else's file for the server to sign a link to.
--
-- 3. A firm policy could be reworded after people had acknowledged it. The
--    acknowledgement is pinned to a version, and that only means something
--    if the version's words cannot change. The wording of a version is now
--    frozen; the app only ever moves the "current" marker, and a new wording
--    is a new version, which puts it back in front of everyone.
--
-- 4. The firm-half records were insert and select only by policy alone,
--    while the API roles still held the table rights to update and delete.
--    Those rights are withdrawn, and an update is refused outright, for
--    everybody. A delete is still possible for the service role, so that
--    removing a person's account removes what belongs to them.
--
-- 5. Smaller ones: a profile could be created with staff flags set, where
--    the signup trigger had not already made one; the count of names on each
--    piece of work was readable without signing in; and the name on a
--    published session or a posted piece of work came from the request when
--    written directly.
--
-- 6. "Put everything back in front of learners" would have published the
--    whole unchecked Malaysian bank; it now puts back only what a person
--    withdrew. See section 6 below.
--
-- 7. An administrator could sign off a version they wrote themselves, which
--    is the one thing the split between the two staff roles exists to stop.
--
-- 8. The bucket let anybody store files in their own folder for any post; a
--    file is now stored only for work they have put their name on.
--
-- 9. The AI note on an answer is asked for once and kept, rather than being
--    a paid call to the model on every request.
-- =============================================================================

-- 1. The training record is the server's to write ---------------------------

drop policy if exists sessions_own on public.training_sessions;
drop policy if exists sessions_select_own on public.training_sessions;
create policy sessions_select_own on public.training_sessions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tsq_own on public.training_session_questions;
drop policy if exists tsq_select_own on public.training_session_questions;
create policy tsq_select_own on public.training_session_questions
  for select to authenticated
  using (exists (select 1 from public.training_sessions s
                 where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists attempts_insert_own on public.user_question_attempts;

drop policy if exists concept_mastery_own on public.user_concept_mastery;
drop policy if exists concept_mastery_select_own on public.user_concept_mastery;
create policy concept_mastery_select_own on public.user_concept_mastery
  for select to authenticated using (user_id = auth.uid());

drop policy if exists skill_mastery_own on public.user_skill_mastery;
drop policy if exists skill_mastery_select_own on public.user_skill_mastery;
create policy skill_mastery_select_own on public.user_skill_mastery
  for select to authenticated using (user_id = auth.uid());

drop policy if exists review_schedule_own on public.review_schedule;
drop policy if exists review_schedule_select_own on public.review_schedule;
create policy review_schedule_select_own on public.review_schedule
  for select to authenticated using (user_id = auth.uid());

drop policy if exists diagnostic_results_own on public.diagnostic_results;
drop policy if exists diagnostic_results_select_own on public.diagnostic_results;
create policy diagnostic_results_select_own on public.diagnostic_results
  for select to authenticated using (user_id = auth.uid());

drop policy if exists streaks_own on public.user_streaks;
drop policy if exists streaks_select_own on public.user_streaks;
create policy streaks_select_own on public.user_streaks
  for select to authenticated using (user_id = auth.uid());

-- 2. Work is handed in unmarked, and a mark is whoever made it ---------------

create or replace function public.stamp_work_submission()
returns trigger language plpgsql set search_path = public as $$
begin
  new.submitted_at := now();
  new.verdict := null;
  new.feedback := '';
  new.marked_by := null;
  new.marked_at := null;
  return new;
end;
$$;

create or replace function public.guard_work_mark()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id is distinct from old.id
     or new.post_id is distinct from old.post_id
     or new.user_id is distinct from old.user_id
     or new.file_path is distinct from old.file_path
     or new.file_name is distinct from old.file_name
     or new.note is distinct from old.note
     or new.declared_clean is distinct from old.declared_clean
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'A submission is what was handed in; only the marking may change';
  end if;
  if new.verdict is distinct from old.verdict
     or new.feedback is distinct from old.feedback then
    new.marked_at := now();
    -- Through the API the marker is the person signed in, whatever the
    -- request said. The server marks with the service role, where there is
    -- no signed-in person, and names the coach from their session itself.
    if auth.uid() is not null then
      new.marked_by := auth.uid();
    end if;
  else
    -- Nothing about the mark changed, so neither may its name or its date.
    new.marked_at := old.marked_at;
    new.marked_by := old.marked_by;
  end if;
  return new;
end;
$$;

-- Not valid: the rows already there were all written by the app, which
-- builds exactly this path, and the check applies to every row from here.
alter table public.work_submissions
  drop constraint if exists work_submissions_own_folder;
alter table public.work_submissions
  add constraint work_submissions_own_folder check (
    file_path like 'submissions/' || user_id::text || '/' || post_id::text || '/%'
  ) not valid;

-- 3. The words of a firm policy version are fixed -----------------------------

create or replace function public.freeze_firm_module_version()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.body is distinct from old.body
     or new.version is distinct from old.version
     or new.firm_module_id is distinct from old.firm_module_id
     or new.created_at is distinct from old.created_at
     or new.created_by is distinct from old.created_by then
    raise exception 'A published version is what people acknowledged; publish a new version instead';
  end if;
  return new;
end;
$$;

create or replace trigger firm_module_versions_freeze
  before update on public.firm_module_versions
  for each row execute function public.freeze_firm_module_version();

-- 4. Firm-half records: insert and select, for everybody ----------------------

-- The one change let through is a column becoming empty, which is what a
-- foreign key does when the account it names is removed. Anything else is a
-- change to what was recorded.
create or replace function public.block_record_update()
returns trigger language plpgsql set search_path = public as $$
declare
  was jsonb := to_jsonb(old);
  now_is jsonb := to_jsonb(new);
  k text;
begin
  for k in select jsonb_object_keys(was) loop
    if now_is -> k is distinct from was -> k and now_is -> k <> 'null'::jsonb then
      raise exception '% is a record: add a correction, do not change what was recorded',
        tg_table_name;
    end if;
  end loop;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'firm_module_acknowledgements',
    'firm_step_declarations',
    'firm_step_confirmations',
    'onboarding_decisions',
    'homework_declarations',
    'work_claims',
    'work_messages'
  ] loop
    execute format('revoke update, delete, truncate on public.%I from anon, authenticated', t);
    execute format(
      'create or replace trigger %I before update on public.%I for each row execute function public.block_record_update()',
      t || '_no_update', t
    );
  end loop;
end
$$;

revoke delete, truncate on public.work_submissions from anon, authenticated;
revoke update, delete, truncate on public.user_question_attempts from anon, authenticated;

-- 5. The smaller ones ---------------------------------------------------------

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and not is_admin and not coalesce(is_coach, false));

revoke all on public.work_claim_counts from anon;

create or replace function public.stamp_coach_session()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
    if auth.uid() is not null then
      new.published_by := auth.uid();
    end if;
  elsif not new.published then
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_work_post_author()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null then
    new.posted_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace trigger work_posts_author
  before insert on public.work_posts
  for each row execute function public.stamp_work_post_author();

-- 6. Withdrawn by a person, not merely unpublished ----------------------------
-- "Put everything back in front of learners" undoes a bulk withdrawal. It
-- found what to put back by status alone, and the Malaysian bank arrives with
-- that same status because it never publishes itself, so on a new install the
-- button would have published every unchecked Malaysian question at once.
-- Withdrawing now stamps the moment, and only stamped content goes back.
alter table public.questions add column if not exists withdrawn_at timestamptz;
alter table public.daily_facts add column if not exists withdrawn_at timestamptz;

-- 7. Nobody signs off their own writing ----------------------------------------
-- The server refuses it; this is the same rule where no request can reach
-- round it. Not valid, so an existing row is not judged by a rule it predates.
alter table public.question_versions
  drop constraint if exists question_versions_not_self_verified;
alter table public.question_versions
  add constraint question_versions_not_self_verified check (
    verified_by is null or created_by is null or verified_by <> created_by
  ) not valid;

alter table public.daily_facts
  drop constraint if exists daily_facts_not_self_verified;
alter table public.daily_facts
  add constraint daily_facts_not_self_verified check (
    verified_by is null or created_by is null or verified_by <> created_by
  ) not valid;

-- 8. A file is handed in only for work with your name on it --------------------
-- The folder check alone let anybody signed in store files under their own
-- name for any post, or none, up to the bucket's limit, as often as they
-- liked. The third folder is the post, and it has to be one they claimed.
drop policy if exists work_submissions_insert_own on storage.objects;
create policy work_submissions_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'work'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.work_claims c
      where c.user_id = auth.uid()
        and c.post_id::text = (storage.foldername(name))[3]
    )
  );

-- 9. One AI note per answer ------------------------------------------------------
-- Asking for the coach's note on an answered question was a fresh paid call to
-- the model every time, with nothing to stop it being asked for in a loop. The
-- note is now kept against the answer and handed back on a second request.
alter table public.training_session_questions
  add column if not exists coach_note text;
alter table public.training_session_questions
  add column if not exists coach_note_at timestamptz;
