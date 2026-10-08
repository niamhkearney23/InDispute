-- =============================================================================
-- The third audit: what the database still allowed that the app never does
-- =============================================================================
-- 1. A coach could delete a session, a certification trainee (and with it
--    every graded entry) or a work post by calling the database directly,
--    because each table had one "for all" policy for coaches. The app never
--    deletes any of them: a session is taken down by unpublishing, a graded
--    entry is corrected in place. Writes are now insert and update only.
-- 2. A work post's file could be pointed at any object in the bucket,
--    including an intern's handed-in work, which the app would then sign a
--    link to for everybody who can see the post. A post's files now have to
--    sit in that post's own folder.
-- 3. A learner could set their matter recording's path to anybody's file,
--    which the server would then sign. It now has to be under their own
--    folder and that attempt.
-- 4. A learner could set their photo to any address on the internet, which
--    every coach opening Admin, Trainees would then load. It now has to be
--    their own file in the avatars bucket.
-- 5. Scores by area were added up per concept, so a question tagged with
--    three concepts counted three times. area_scores counts answers, once
--    each, by the question's own area: the share of answers that were right,
--    as the pages say. Server only.
-- =============================================================================

-- 1. No deletes by coaches ----------------------------------------------------

drop policy if exists coach_sessions_write on public.coach_sessions;
drop policy if exists coach_sessions_insert on public.coach_sessions;
create policy coach_sessions_insert on public.coach_sessions
  for insert to authenticated with check (public.is_coach());
drop policy if exists coach_sessions_update on public.coach_sessions;
create policy coach_sessions_update on public.coach_sessions
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- The register had no read policy of its own: "for all" covered reading
-- too. Coaches keep reading it.
drop policy if exists certification_trainees_read on public.certification_trainees;
create policy certification_trainees_read on public.certification_trainees
  for select to authenticated using (public.is_coach());
drop policy if exists certification_entries_read on public.certification_entries;
create policy certification_entries_read on public.certification_entries
  for select to authenticated using (public.is_coach());

drop policy if exists certification_trainees_write on public.certification_trainees;
drop policy if exists certification_trainees_insert on public.certification_trainees;
create policy certification_trainees_insert on public.certification_trainees
  for insert to authenticated with check (public.is_coach());
drop policy if exists certification_trainees_update on public.certification_trainees;
create policy certification_trainees_update on public.certification_trainees
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

drop policy if exists certification_entries_write on public.certification_entries;
drop policy if exists certification_entries_insert on public.certification_entries;
create policy certification_entries_insert on public.certification_entries
  for insert to authenticated with check (public.is_coach());
drop policy if exists certification_entries_update on public.certification_entries;
create policy certification_entries_update on public.certification_entries
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

drop policy if exists work_posts_write on public.work_posts;
drop policy if exists work_posts_insert on public.work_posts;
create policy work_posts_insert on public.work_posts
  for insert to authenticated with check (public.is_coach());
drop policy if exists work_posts_update on public.work_posts;
create policy work_posts_update on public.work_posts
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- 2. A post's files live in its own folder -------------------------------------

alter table public.work_posts drop constraint if exists work_posts_files_own_folder;
alter table public.work_posts add constraint work_posts_files_own_folder check (
  (file_path is null or file_path like 'posts/' || id::text || '/%')
  and (memo_path is null or memo_path like 'posts/' || id::text || '/%')
);

-- 3. A recording lives under its own learner and attempt -----------------------

alter table public.matter_attempts drop constraint if exists matter_attempts_recording_own_folder;
alter table public.matter_attempts add constraint matter_attempts_recording_own_folder check (
  recording_path is null
  or recording_path ~ ('^' || user_id::text || '/' || id::text || '/[0-9]+\.[a-z0-9]+$')
);

-- 4. A photo is your own file in the avatars bucket ----------------------------

alter table public.profiles drop constraint if exists profiles_avatar_own_file;
alter table public.profiles add constraint profiles_avatar_own_file check (
  avatar_url is null
  or avatar_url like '%/storage/v1/object/public/avatars/' || id::text || '/%'
);

-- 5. Scores by area, one count per answer --------------------------------------

create or replace function public.area_scores(uid uuid)
returns table (domain_id uuid, answered integer, right_answers integer)
language sql
stable
set search_path = public
as $$
  select q.domain_id,
         count(*)::integer,
         (count(*) filter (where a.is_correct))::integer
  from public.user_question_attempts a
  join public.questions q on q.id = a.question_id
  where a.user_id = uid
  group by q.domain_id
$$;

revoke all on function public.area_scores(uuid) from public;
revoke all on function public.area_scores(uuid) from anon;
revoke all on function public.area_scores(uuid) from authenticated;
grant execute on function public.area_scores(uuid) to service_role;
