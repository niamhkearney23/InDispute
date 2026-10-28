-- =============================================================================
-- The Advocacy Studio: record, review, refine
-- =============================================================================
-- The owner, October 2026: "Students should be able to record their own
-- advocacy submissions and receive an initial structured AI review." A
-- learner picks an exercise a lawyer has signed off, records themselves
-- (video, or sound alone), watches it back, and asks for feedback. The
-- recording is transcribed and the AI writes feedback against the exercise's
-- own rubric, quoting only words that are in the transcript. A coach can then
-- review it, under their own name, kept apart from what the AI said.
--
-- What holds here, in the database, and not only in the app:
--
--   * NOTHING IS RECORDED OR PROCESSED WITHOUT CONSENT, and consent is a
--     record, not a flag: every decision is a row (studio_consents), so what
--     somebody agreed to, and when, stays true afterwards.
--   * A RECORDING IS PRIVATE. Its bucket has no policy for anybody; the server
--     hands out a link to upload one file to one place, and short-lived links
--     to play it back, after checking who is asking.
--   * A COACH SEES AN ATTEMPT ONLY WHEN THE LEARNER SHARED IT, and every time
--     a coach opens one is written down (studio_access_log).
--   * A COACH'S REVIEW IS THEIRS, AND KEPT. Reviews are insert-only: a
--     correction is a new review. Nobody reviews their own attempt.
--   * THE LEARNER CAN DELETE THEIR RECORDING. The attempt stays as a dated
--     line in their history ("deleted"); the recording, transcript and AI
--     feedback go. Deleting the account does the same (see the end).
-- =============================================================================

-- 1. Consent ------------------------------------------------------------------

create table if not exists public.studio_consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  -- Which wording of the notice they read (src/lib/studio/rules.ts).
  notice_version  text not null check (notice_version ~ '^[0-9]{4}-[0-9]{2}$'),
  recording       boolean not null,
  ai_processing   boolean not null,
  trainer_sharing boolean not null,
  decided_at      timestamptz not null default now(),
  -- AI feedback needs a recording to work from.
  constraint studio_consents_ai_needs_recording check (recording or not ai_processing),
  constraint studio_consents_sharing_needs_recording check (recording or not trainer_sharing)
);

create index if not exists studio_consents_user_idx
  on public.studio_consents (user_id, decided_at desc);

alter table public.studio_consents enable row level security;
revoke all on public.studio_consents from public, anon, authenticated;
grant select on public.studio_consents to authenticated;
revoke update, delete, truncate on public.studio_consents from service_role;

drop policy if exists studio_consents_own on public.studio_consents;
create policy studio_consents_own on public.studio_consents
  for select to authenticated using (user_id = auth.uid());

-- 2. Attempts ------------------------------------------------------------------

create table if not exists public.studio_attempts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  -- The exercise and the exact wording (and rubric) it was given, as signed off.
  exercise_key          text not null check (exercise_key ~ '^[a-z0-9-]{3,80}$'),
  exercise_hash         text not null check (exercise_hash ~ '^[0-9a-f]{64}$'),
  started_at            timestamptz not null default now(),
  recording_kind        text check (recording_kind in ('video', 'audio')),
  recording_path        text,
  recording_mime        text check (recording_mime is null or recording_mime ~ '^(video|audio)/[a-z0-9.+-]{1,40}$'),
  recording_bytes       integer check (recording_bytes is null or recording_bytes between 1 and 52428800),
  recording_seconds     integer check (recording_seconds is null or recording_seconds between 1 and 600),
  uploaded_at           timestamptz,
  status                text not null default 'awaiting_upload' check (status in (
                          'awaiting_upload', 'uploaded', 'processing', 'feedback',
                          'failed', 'not_configured', 'deleted')),
  -- What the learner agreed to for this attempt, copied from their consent.
  ai_processing         boolean not null default false,
  shared_with_trainer   boolean not null default false,
  transcript            text check (transcript is null or char_length(transcript) <= 40000),
  transcript_segments   jsonb,
  transcript_model      text,
  feedback              jsonb,
  feedback_model        text,
  assessment_version    text,
  timings               jsonb,
  failure               text check (failure is null or char_length(failure) <= 500),
  processing_started_at timestamptz,
  feedback_at           timestamptz,
  deleted_at            timestamptz,
  -- The file lives in the learner's own folder, under this attempt.
  constraint studio_attempts_path_shape check (
    recording_path is null
    or recording_path ~ ('^' || user_id || '/' || id || '/recording\.(webm|mp4|m4a|ogg)$')),
  -- A deleted attempt keeps nothing of what was said.
  constraint studio_attempts_deleted_is_empty check (
    deleted_at is null
    or (status = 'deleted' and recording_path is null and transcript is null
        and transcript_segments is null and feedback is null)),
  constraint studio_attempts_feedback_needs_consent check (feedback is null or ai_processing)
);

create index if not exists studio_attempts_user_idx
  on public.studio_attempts (user_id, started_at desc);
create index if not exists studio_attempts_shared_idx
  on public.studio_attempts (started_at desc) where shared_with_trainer and deleted_at is null;

alter table public.studio_attempts enable row level security;
revoke all on public.studio_attempts from public, anon, authenticated;
grant select on public.studio_attempts to authenticated;
-- The server writes attempts; it never deletes one (a deletion empties it).
revoke delete, truncate on public.studio_attempts from service_role;

drop policy if exists studio_attempts_read on public.studio_attempts;
create policy studio_attempts_read on public.studio_attempts
  for select to authenticated using (
    user_id = auth.uid()
    or (public.is_coach() and shared_with_trainer and deleted_at is null)
  );

create or replace function public.guard_studio_attempt()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.user_id is distinct from old.user_id
     or new.exercise_key is distinct from old.exercise_key
     or new.exercise_hash is distinct from old.exercise_hash
     or new.started_at is distinct from old.started_at then
    raise exception 'An attempt keeps whose it is, and what exercise it was.' using errcode = '42501';
  end if;
  if old.deleted_at is not null then
    raise exception 'A deleted recording stays deleted.' using errcode = '42501';
  end if;
  if old.recording_path is not null and new.recording_path is distinct from old.recording_path
     and new.deleted_at is null then
    raise exception 'A recording is not swapped for another; record a new attempt.' using errcode = '42501';
  end if;
  if old.transcript is not null and new.transcript is distinct from old.transcript
     and new.deleted_at is null then
    raise exception 'A transcript is kept as it was made.' using errcode = '42501';
  end if;
  if old.feedback is not null and new.feedback is distinct from old.feedback
     and new.deleted_at is null then
    raise exception 'AI feedback is kept as it was given; a coach adds a review instead.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_studio_attempt() from public;

create or replace trigger studio_attempts_guard
  before update on public.studio_attempts
  for each row execute function public.guard_studio_attempt();

-- 3. A coach's review ------------------------------------------------------------

create table if not exists public.studio_reviews (
  id                     uuid primary key default gen_random_uuid(),
  attempt_id             uuid not null references public.studio_attempts (id) on delete cascade,
  reviewer_id            uuid not null references public.profiles (id),
  feedback               text not null check (char_length(btrim(feedback)) between 1 and 6000),
  -- A coach's own marks, by dimension, where they differ from the AI's:
  -- a whole number 0 to 10, or "not_assessed".
  score_overrides        jsonb not null default '{}'::jsonb,
  -- The coach's view of each AI comment, by its id: "approved" or "rejected".
  ai_comment_decisions   jsonb not null default '{}'::jsonb,
  follow_up_exercise_key text check (follow_up_exercise_key is null
                                     or follow_up_exercise_key ~ '^[a-z0-9-]{3,80}$'),
  created_at             timestamptz not null default now(),
  constraint studio_reviews_overrides_object check (jsonb_typeof(score_overrides) = 'object'),
  constraint studio_reviews_decisions_object check (jsonb_typeof(ai_comment_decisions) = 'object')
);

create index if not exists studio_reviews_attempt_idx
  on public.studio_reviews (attempt_id, created_at desc);

alter table public.studio_reviews enable row level security;
revoke all on public.studio_reviews from public, anon, authenticated;
grant select on public.studio_reviews to authenticated;
revoke update, delete, truncate on public.studio_reviews from service_role;

drop policy if exists studio_reviews_read on public.studio_reviews;
create policy studio_reviews_read on public.studio_reviews
  for select to authenticated using (
    exists (select 1 from public.studio_attempts a
             where a.id = attempt_id and a.user_id = auth.uid())
    or public.is_coach()
  );

create or replace function public.guard_studio_review()
returns trigger language plpgsql set search_path = public as $$
declare
  a public.studio_attempts%rowtype;
begin
  if tg_op <> 'INSERT' then
    raise exception 'A review is kept as it was written; write another to correct it.' using errcode = '42501';
  end if;
  select * into a from public.studio_attempts where id = new.attempt_id;
  if a.user_id = new.reviewer_id then
    raise exception 'Nobody reviews their own attempt.' using errcode = '42501';
  end if;
  if not a.shared_with_trainer or a.deleted_at is not null then
    raise exception 'Only an attempt the learner shared, and has not deleted, is reviewed.' using errcode = '42501';
  end if;
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.guard_studio_review() from public;

create or replace trigger studio_reviews_guard
  before insert or update or delete on public.studio_reviews
  for each row execute function public.guard_studio_review();

-- 4. Who opened what --------------------------------------------------------------

create table if not exists public.studio_access_log (
  id         uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.studio_attempts (id) on delete cascade,
  staff_id   uuid not null references public.profiles (id),
  action     text not null check (action in ('opened', 'reviewed')),
  at         timestamptz not null default now()
);

create index if not exists studio_access_log_attempt_idx
  on public.studio_access_log (attempt_id, at desc);

alter table public.studio_access_log enable row level security;
-- No policy for anybody: the server writes it and reads it.
revoke all on public.studio_access_log from public, anon, authenticated, service_role;
grant select, insert on public.studio_access_log to service_role;

create or replace function public.refuse_studio_log_change()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'The record of who opened a recording is kept as it was written.' using errcode = '42501';
end;
$$;
revoke all on function public.refuse_studio_log_change() from public;

create or replace trigger studio_access_log_kept
  before update or delete on public.studio_access_log
  for each row execute function public.refuse_studio_log_change();
create or replace trigger studio_access_log_no_truncate
  before truncate on public.studio_access_log
  for each statement execute function public.refuse_studio_log_change();
create or replace trigger studio_consents_kept
  before update or delete on public.studio_consents
  for each row execute function public.refuse_studio_log_change();

-- 5. The recordings bucket -----------------------------------------------------------
-- Private, with no policy for anybody: uploads arrive through a one-file
-- signed link the server makes, and playback through short-lived signed
-- links, after the server has checked who is asking. 50 MB holds two
-- minutes of video at the bit rate the recorder asks for, with room.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-recordings', 'studio-recordings', false, 52428800, array[
  'video/webm',
  'video/mp4',
  'audio/webm',
  'audio/mp4',
  'audio/ogg'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 6. Deleting the account empties the Studio too --------------------------------------
-- erase_account (0043, 0045) stamps profiles.erased_at in its own
-- transaction; this follows it there, so the attempts are emptied in the same
-- transaction. The files go with the rest of the person's files (the
-- storage step lists studio-recordings/<user id>).
create or replace function public.erase_studio_attempts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.erased_at is null and new.erased_at is not null then
    update public.studio_attempts
       set status = 'deleted',
           deleted_at = now(),
           recording_path = null,
           transcript = null,
           transcript_segments = null,
           feedback = null,
           shared_with_trainer = false
     where user_id = new.id and deleted_at is null;
  end if;
  return new;
end;
$$;
revoke all on function public.erase_studio_attempts() from public, anon, authenticated;

create or replace trigger profiles_erase_studio
  after update of erased_at on public.profiles
  for each row execute function public.erase_studio_attempts();
