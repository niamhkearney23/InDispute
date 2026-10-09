-- =============================================================================
-- Uploads, email and names: the fourth audit
-- =============================================================================
-- 1. A coach's file or voice memo on a work post now carries the same
--    declaration an intern makes when handing work in: nothing in it
--    identifies a client. The database refuses a post with a file or a memo
--    and no declaration.
-- 2. A learner's recorded explanation on a matter carries it too.
-- 3. A file handed in carries the nonce of the form it came from, so pressing
--    the button twice, or a retry after a slow upload, makes one submission.
-- 4. Entering a firm's code is limited: ten wrong codes in an hour and the
--    form stops looking codes up, so the codes cannot be guessed by trying.
-- 5. A display name is one to eighty characters, and the signup trigger
--    shortens what arrives instead of failing on it.
-- 6. A draft from email records what vouched for the sender: DMARC, or a
--    DKIM signature from the From address's own domain. SPF on its own no
--    longer lets an email in, because it checks the envelope sender, which
--    is not the address anybody sees.
--
-- None of the checks here is "not valid" (see 0024: a not valid check is
-- re-checked on every update of an old row, which froze rows solid). The old
-- rows are brought into line first, below, and every check is then validated
-- against everything already there.
-- =============================================================================

-- 1. A coach's upload carries a declaration ------------------------------------

alter table public.work_posts
  add column if not exists declared_clean boolean not null default false;

-- Posts with a file or a memo from before the declaration existed. There was
-- no box to tick when they went up, so these are marked as covered rather than
-- left to fail the check below; without this, no old post with a file could
-- be edited again, not even to take it down. The one exception is a draft
-- that arrived by email and is not up: nobody may have looked at that
-- attachment, so it is taken off the draft instead of being vouched for. The
-- file itself stays in storage under the post's folder; the coach attaches
-- it again, with the declaration, if they still want it.
update public.work_posts
   set file_path = null, file_name = null
 where source = 'email' and not published
   and file_path is not null and not declared_clean;

update public.work_posts
   set declared_clean = true
 where not declared_clean
   and (file_path is not null or memo_path is not null);

alter table public.work_posts drop constraint if exists work_posts_files_declared_clean;
alter table public.work_posts add constraint work_posts_files_declared_clean check (
  (file_path is null and memo_path is null) or declared_clean
);

-- 2. A matter recording carries a declaration ----------------------------------

alter table public.matter_attempts
  add column if not exists recording_declared_clean boolean not null default false;

-- Recordings from before the declaration existed, marked as covered for the
-- same reason as the posts above: an attempt that cannot be updated cannot
-- be marked. This runs before the guard below learns the column, so it
-- reaches attempts already handed in as well.
update public.matter_attempts
   set recording_declared_clean = true
 where recording_path is not null and not recording_declared_clean;

alter table public.matter_attempts drop constraint if exists matter_attempts_recording_declared_clean;
alter table public.matter_attempts add constraint matter_attempts_recording_declared_clean check (
  recording_path is null or recording_declared_clean
);

-- The learner makes the declaration through their own client, with the
-- recording, so they may write the column; the guard freezes it at hand-in.
grant update (recording_declared_clean) on public.matter_attempts to authenticated;

-- As in 0027, with the declaration added to what is frozen at hand-in.
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

-- 3. One submission per form ----------------------------------------------------

-- Made by the form when it is drawn. Null on everything handed in before.
alter table public.work_submissions add column if not exists client_nonce uuid;

create unique index if not exists work_submissions_client_nonce_once
  on public.work_submissions (client_nonce) where client_nonce is not null;

-- As in 0022, with the nonce added to what is handed in and never changes.
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
     or new.client_nonce is distinct from old.client_nonce
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

-- 4. Wrong codes, counted ---------------------------------------------------------

-- One row per code entered that matched nothing. Written by the server with
-- the service role and read by it; no learner policy, so a learner can
-- neither read the count nor clear it.
create table if not exists public.code_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists code_attempts_user_recent
  on public.code_attempts (user_id, attempted_at desc);

alter table public.code_attempts enable row level security;
revoke all on public.code_attempts from anon, authenticated;

-- 5. A display name is one to eighty characters ---------------------------------

-- Anything already there is brought inside the rule first: spaces off both
-- ends, cut to eighty, and a name that is nothing but spaces becomes no name.
update public.profiles
   set display_name = nullif(btrim(left(btrim(display_name), 80)), '')
 where display_name is not null
   and (display_name <> btrim(display_name) or char_length(display_name) > 80 or btrim(display_name) = '');

alter table public.profiles drop constraint if exists profiles_display_name_length;
alter table public.profiles add constraint profiles_display_name_length check (
  display_name is null or char_length(display_name) between 1 and 80
);

-- As in 0018, with the name cut to the same rule. The name arrives from the
-- browser and could be any length; a signup that failed on it would leave an
-- auth user with no profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_track learner_track :=
    case when new.raw_user_meta_data ->> 'track' = 'litigation_trainee'
      then 'litigation_trainee' else 'general' end;
begin
  insert into public.profiles (id, email, display_name, country, track)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(left(btrim(new.raw_user_meta_data ->> 'display_name'), 80)), ''),
      nullif(btrim(left(split_part(new.email, '@', 1), 80)), '')
    ),
    case
      when chosen_track = 'litigation_trainee' then 'MY'
      when new.raw_user_meta_data ->> 'country' = 'MY' then 'MY'
      else 'AU'
    end::country,
    chosen_track
  )
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 6. What vouched for an email's sender -------------------------------------------

-- 'dmarc' or 'dkim' (a signature from the From address's own domain). Null on
-- drafts from before this, which were let in on SPF alone, and the page says
-- so on those.
alter table public.work_posts add column if not exists inbound_auth text;
alter table public.work_posts drop constraint if exists work_posts_inbound_auth_known;
alter table public.work_posts add constraint work_posts_inbound_auth_known check (
  inbound_auth is null or inbound_auth in ('dmarc', 'dkim')
);
