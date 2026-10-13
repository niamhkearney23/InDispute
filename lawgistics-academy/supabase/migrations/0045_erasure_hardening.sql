-- =============================================================================
-- Deleting an account, made safe to rely on
-- =============================================================================
-- 0043 let a person delete their account. The owner reviewed it and asked for
-- six things, all of which are here.
--
-- 1. Access ends in the database, whatever Supabase Auth does. 0043 relied on
--    the auth server banning the account. If that call failed after the
--    database had been cleared, a session already open, or an access token
--    still inside its hour, carried on working. Now:
--      * erase_account deletes the person's sessions and refresh tokens in the
--        same transaction, so no token can be refreshed;
--      * every request PostgREST serves first runs check_request(), which
--        refuses a caller whose profile is erased, so a token that is still
--        valid reaches nothing;
--      * every table with Row Level Security, and storage.objects, carries a
--        restrictive policy refusing an erased caller, in case the pre-request
--        check is ever not configured.
--
-- 2. Deletion is a recorded job (account_erasures) that can be resumed. Each
--    step records when it finished: the database, the sessions, sign-in (a new
--    address, a password nobody knows and a ban), and the stored files. The
--    server (src/lib/account/erasure.ts) runs whatever is not finished, a
--    daily job retries what failed, and administrators see every step at
--    Admin, Deletions. A job is complete only when every step is.
--
-- 3. What stays is not anonymous, and nothing here says it is. The name,
--    email and photo are removed. Written answers, messages, attachments and
--    certification records that the firm keeps may still identify the person,
--    which is why there is a review (5 and 6 below).
--
-- 4. Work-board messages and comments are kept only where supervision needs
--    them. On deletion the person's own messages and comments are replaced
--    with a short notice unless a coach or administrator marked one "kept for
--    supervision", with a reason. Messages and comments on a piece of work
--    that closed longer ago than the retention period (24 months by default,
--    WORK_BOARD_RETENTION_MONTHS in src/lib/account/retention.ts) are replaced
--    the same way by the daily job, unless kept for supervision.
--
-- 5. Finding what may still identify somebody. The job keeps the name the
--    person had (former_display_name) only while the review is open, so the
--    review can search coaches' messages and comments for it; closing the
--    review clears it. erasure_identifying_records() lists what remains.
--
-- 6. The certification register can now be linked to an account
--    (certification_trainees.profile_id, set by an administrator). Deleting a
--    linked account queues every linked trainee record and entry for a
--    decision: redact the identifying details (names and free text; grades,
--    dates and box numbers stay) or retain, with a reason. The review closes
--    only once every item is decided.
--
-- Everything here can be run again.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The words that replace removed text
-- -----------------------------------------------------------------------------
-- The app shows the same words (src/lib/account/retention.ts), and a test
-- holds the two together.
create or replace function public.redacted_text(reason text)
returns text
language sql
immutable
set search_path = public
as $$
  select case reason
    when 'erasure' then 'Removed when the account was deleted.'
    when 'retention' then 'Removed at the end of the retention period.'
    when 'review' then 'Removed by an administrator to protect personal information.'
  end;
$$;

-- -----------------------------------------------------------------------------
-- 2. The job
-- -----------------------------------------------------------------------------
create table if not exists public.account_erasures (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  requested_by        uuid references auth.users (id) on delete set null,
  requested_at        timestamptz not null default now(),
  former_display_name text,
  pending_files       text[] not null default '{}',
  database_done_at    timestamptz,
  sessions_done_at    timestamptz,
  auth_done_at        timestamptz,
  storage_done_at     timestamptz,
  attempts            integer not null default 0,
  last_attempt_at     timestamptz,
  last_error          text,
  completed_at        timestamptz,
  review_closed_at    timestamptz,
  review_closed_by    uuid references auth.users (id) on delete set null
);

alter table public.account_erasures drop constraint if exists account_erasures_complete_means_every_step;
alter table public.account_erasures add constraint account_erasures_complete_means_every_step check (
  completed_at is null
  or (database_done_at is not null and sessions_done_at is not null
      and auth_done_at is not null and storage_done_at is not null)
);
alter table public.account_erasures drop constraint if exists account_erasures_name_only_while_open;
alter table public.account_erasures add constraint account_erasures_name_only_while_open check (
  review_closed_at is null or former_display_name is null
);
alter table public.account_erasures drop constraint if exists account_erasures_error_length;
alter table public.account_erasures add constraint account_erasures_error_length check (
  last_error is null or length(last_error) <= 2000
);

create index if not exists account_erasures_incomplete_idx
  on public.account_erasures (last_attempt_at nulls first)
  where completed_at is null;

alter table public.account_erasures enable row level security;
-- No policy for anybody: the server reads and writes it with the service role.
revoke all on public.account_erasures from public, anon, authenticated;
grant select, insert, update on public.account_erasures to service_role;

-- A finished step stays finished, the request stays who and when it was, a
-- closed review stays closed, and the former name can only be cleared.
create or replace function public.guard_account_erasure()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.user_id is distinct from old.user_id
     or new.requested_at is distinct from old.requested_at
     or (new.requested_by is distinct from old.requested_by and new.requested_by is not null) then
    raise exception 'A deletion keeps who asked for it and when';
  end if;
  if (old.database_done_at is not null and new.database_done_at is distinct from old.database_done_at)
     or (old.sessions_done_at is not null and new.sessions_done_at is null)
     or (old.auth_done_at is not null and new.auth_done_at is null)
     or (old.storage_done_at is not null and new.storage_done_at is null)
     or (old.completed_at is not null and new.completed_at is distinct from old.completed_at) then
    raise exception 'A finished step of a deletion stays finished';
  end if;
  if new.attempts < old.attempts then
    raise exception 'The number of attempts only goes up';
  end if;
  if old.review_closed_at is not null and new.review_closed_at is distinct from old.review_closed_at then
    raise exception 'A closed review stays closed';
  end if;
  if new.former_display_name is not null
     and new.former_display_name is distinct from old.former_display_name then
    raise exception 'The former name is only ever cleared';
  end if;
  return new;
end;
$$;

create or replace trigger account_erasures_guard
  before update on public.account_erasures
  for each row execute function public.guard_account_erasure();

-- -----------------------------------------------------------------------------
-- 3. Linking the certification register to an account
-- -----------------------------------------------------------------------------
alter table public.certification_trainees
  add column if not exists profile_id uuid references public.profiles (id) on delete set null;

create index if not exists certification_trainees_profile_idx
  on public.certification_trainees (profile_id)
  where profile_id is not null;

-- Only the server sets the link (an administrator, through
-- link_certification_trainee). A coach can edit the register through RLS, so
-- without this a coach could attach a record to somebody's account.
create or replace function public.guard_certification_link()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.profile_id is not null then
      raise exception 'A register record is linked to an account by an administrator';
    end if;
  elsif new.profile_id is distinct from old.profile_id then
    raise exception 'A register record is linked to an account by an administrator';
  end if;
  return new;
end;
$$;

create or replace trigger certification_trainees_link_guard
  before insert or update on public.certification_trainees
  for each row execute function public.guard_certification_link();

-- -----------------------------------------------------------------------------
-- 4. The review queue for certification records
-- -----------------------------------------------------------------------------
create table if not exists public.erasure_review_items (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.account_erasures (user_id) on delete cascade,
  certification_trainee_id uuid references public.certification_trainees (id) on delete cascade,
  certification_entry_id   uuid references public.certification_entries (id) on delete cascade,
  created_at               timestamptz not null default now(),
  decision                 text,
  reason                   text,
  decided_by               uuid references auth.users (id) on delete set null,
  decided_at               timestamptz
);

alter table public.erasure_review_items drop constraint if exists erasure_review_items_one_target;
alter table public.erasure_review_items add constraint erasure_review_items_one_target check (
  num_nonnulls(certification_trainee_id, certification_entry_id) = 1
);
alter table public.erasure_review_items drop constraint if exists erasure_review_items_decision_known;
alter table public.erasure_review_items add constraint erasure_review_items_decision_known check (
  decision is null or decision in ('redact', 'retain')
);
alter table public.erasure_review_items drop constraint if exists erasure_review_items_decided_fully;
alter table public.erasure_review_items add constraint erasure_review_items_decided_fully check (
  (decision is null and decided_at is null and reason is null)
  or (decision is not null and decided_at is not null
      and (decision = 'redact' or length(trim(coalesce(reason, ''))) >= 3))
);

create unique index if not exists erasure_review_items_trainee_once
  on public.erasure_review_items (user_id, certification_trainee_id)
  where certification_trainee_id is not null;
create unique index if not exists erasure_review_items_entry_once
  on public.erasure_review_items (user_id, certification_entry_id)
  where certification_entry_id is not null;

alter table public.erasure_review_items enable row level security;
revoke all on public.erasure_review_items from public, anon, authenticated;
grant select on public.erasure_review_items to service_role;

-- A decision is made once and stays as it was made.
create or replace function public.guard_erasure_review_item()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.decision is not null then
    raise exception 'That review item has already been decided';
  end if;
  if new.user_id is distinct from old.user_id
     or new.certification_trainee_id is distinct from old.certification_trainee_id
     or new.certification_entry_id is distinct from old.certification_entry_id
     or new.created_at is distinct from old.created_at then
    raise exception 'A review item keeps what it is about';
  end if;
  if new.decision is not null then
    new.decided_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger erasure_review_items_guard
  before update on public.erasure_review_items
  for each row execute function public.guard_erasure_review_item();

-- Every register record linked to this person, and every entry under one, that
-- is not already queued. Internal: called by erase_account and
-- link_certification_trainee.
create or replace function public.queue_certification_review(uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  added integer := 0;
  n integer;
begin
  insert into public.erasure_review_items (user_id, certification_trainee_id)
  select uid, t.id
    from public.certification_trainees t
   where t.profile_id = uid
     and not exists (
       select 1 from public.erasure_review_items r
        where r.user_id = uid and r.certification_trainee_id = t.id);
  get diagnostics n = row_count;
  added := added + n;

  insert into public.erasure_review_items (user_id, certification_entry_id)
  select uid, e.id
    from public.certification_entries e
    join public.certification_trainees t on t.id = e.trainee_id
   where t.profile_id = uid
     and not exists (
       select 1 from public.erasure_review_items r
        where r.user_id = uid and r.certification_entry_id = e.id);
  get diagnostics n = row_count;
  return added + n;
end;
$$;

revoke all on function public.queue_certification_review(uuid) from public, anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. Work-board messages and comments: kept for supervision, or removed
-- -----------------------------------------------------------------------------
alter table public.work_messages add column if not exists kept_for_supervision boolean not null default false;
alter table public.work_messages add column if not exists kept_by uuid references auth.users (id) on delete set null;
alter table public.work_messages add column if not exists kept_reason text;
alter table public.work_messages add column if not exists kept_at timestamptz;
alter table public.work_messages add column if not exists redacted_at timestamptz;
alter table public.work_messages add column if not exists redacted_reason text;
alter table public.work_messages add column if not exists redacted_by uuid references auth.users (id) on delete set null;

alter table public.work_comments add column if not exists kept_for_supervision boolean not null default false;
alter table public.work_comments add column if not exists kept_by uuid references auth.users (id) on delete set null;
alter table public.work_comments add column if not exists kept_reason text;
alter table public.work_comments add column if not exists kept_at timestamptz;
alter table public.work_comments add column if not exists redacted_at timestamptz;
alter table public.work_comments add column if not exists redacted_reason text;
alter table public.work_comments add column if not exists redacted_by uuid references auth.users (id) on delete set null;

-- Whether this statement is one of the redaction functions below at work.
-- The same two-part test as erasing() in 0043: a transaction-local setting,
-- and the caller running as the functions' owner, which a client that sets
-- the same value is not.
create or replace function public.redacting()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(current_setting('app.redacting', true), '') = 'on'
    and current_user = (
      select pg_get_userbyid(p.proowner) from pg_proc p
      where p.oid = 'public.erase_account(uuid)'::regprocedure
    );
$$;

-- Replaces the "a record is not changed" trigger 0022 put on work_messages,
-- and gives work_comments the same protection, which until now rested on
-- there being no update policy. Three changes get through:
--   * a column becoming empty because the account it named was removed;
--   * the redaction functions replacing the text with the fixed notice (once,
--     and never a message kept for supervision except on an administrator's
--     review);
--   * a coach or administrator marking it kept for supervision, or no longer
--     kept, with their id and a reason.
create or replace function public.guard_work_board_text()
returns trigger language plpgsql set search_path = public as $$
declare
  was jsonb := to_jsonb(old);
  now_is jsonb := to_jsonb(new);
  k text;
  changed text[] := '{}';
begin
  for k in select jsonb_object_keys(was) loop
    if now_is -> k is distinct from was -> k then
      changed := changed || k;
    end if;
  end loop;
  if cardinality(changed) = 0 then
    return new;
  end if;

  if not exists (select 1 from unnest(changed) c where now_is -> c <> 'null'::jsonb) then
    return new;
  end if;

  if changed <@ array['body', 'redacted_at', 'redacted_reason', 'redacted_by'] then
    if not public.redacting() then
      raise exception '% text is removed only by the redaction functions', tg_table_name;
    end if;
    if old.redacted_at is not null then
      raise exception 'That text has already been removed';
    end if;
    if new.redacted_reason is null
       or public.redacted_text(new.redacted_reason) is null
       or new.body is distinct from public.redacted_text(new.redacted_reason) then
      raise exception 'Removed text is replaced with the fixed notice and nothing else';
    end if;
    if old.kept_for_supervision and new.redacted_reason <> 'review' then
      raise exception 'A message kept for supervision is removed only on an administrator''s review';
    end if;
    new.redacted_at := now();
    return new;
  end if;

  if changed <@ array['kept_for_supervision', 'kept_by', 'kept_reason', 'kept_at'] then
    if old.redacted_at is not null then
      raise exception 'That text has already been removed';
    end if;
    if new.kept_by is null or length(trim(coalesce(new.kept_reason, ''))) < 3 then
      raise exception 'Say who decided and why';
    end if;
    if not exists (
      select 1 from public.profiles p
       where p.id = new.kept_by and (p.is_admin or coalesce(p.is_coach, false)) and p.erased_at is null
    ) then
      raise exception 'Only a coach or administrator decides what is kept for supervision';
    end if;
    new.kept_at := now();
    return new;
  end if;

  raise exception '% is a record: add a correction, do not change what was recorded', tg_table_name;
end;
$$;

drop trigger if exists work_messages_no_update on public.work_messages;
create or replace trigger work_messages_guard_text
  before update on public.work_messages
  for each row execute function public.guard_work_board_text();
create or replace trigger work_comments_guard_text
  before update on public.work_comments
  for each row execute function public.guard_work_board_text();

revoke update, delete, truncate on public.work_messages from anon, authenticated;
revoke update, delete, truncate on public.work_comments from anon, authenticated;

-- When a piece of work closed: the latest of its due date and anything that
-- happened on it (published, a name put on it, a hand-in, a mark, a message,
-- a comment). A piece of work that is still being used is not closed.
create or replace function public.work_post_closed_at(post uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    p.created_at,
    p.published_at,
    (p.due_on + 1)::timestamptz,
    (select max(c.claimed_at) from public.work_claims c where c.post_id = p.id),
    (select max(s.submitted_at) from public.work_submissions s where s.post_id = p.id),
    (select max(s.marked_at) from public.work_submissions s where s.post_id = p.id),
    (select max(m.sent_at) from public.work_messages m where m.post_id = p.id),
    (select max(c.created_at) from public.work_comments c where c.post_id = p.id)
  )
  from public.work_posts p
  where p.id = post;
$$;

revoke all on function public.work_post_closed_at(uuid) from public, anon, authenticated;
grant execute on function public.work_post_closed_at(uuid) to service_role;

-- The retention period. The period is passed in, so the one number lives in
-- the app (WORK_BOARD_RETENTION_MONTHS) and nowhere here. Returns how many
-- messages and comments were replaced. The daily job runs it.
create or replace function public.redact_expired_work_board(months integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz;
  n integer;
  total integer := 0;
begin
  if months is null or months < 1 then
    raise exception 'The retention period is at least one month';
  end if;
  cutoff := now() - make_interval(months => months);

  perform set_config('app.redacting', 'on', true);

  update public.work_messages m
     set body = public.redacted_text('retention'), redacted_at = now(), redacted_reason = 'retention'
   where m.redacted_at is null
     and not m.kept_for_supervision
     and public.work_post_closed_at(m.post_id) < cutoff;
  get diagnostics n = row_count;
  total := total + n;

  update public.work_comments c
     set body = public.redacted_text('retention'), redacted_at = now(), redacted_reason = 'retention'
   where c.redacted_at is null
     and not c.kept_for_supervision
     and public.work_post_closed_at(c.post_id) < cutoff;
  get diagnostics n = row_count;
  total := total + n;

  perform set_config('app.redacting', '', true);
  return total;
end;
$$;

revoke all on function public.redact_expired_work_board(integer) from public, anon, authenticated;
grant execute on function public.redact_expired_work_board(integer) to service_role;

-- An administrator removing one message or comment found in a deletion
-- review. Kind is 'message' or 'comment'. Returns whether anything changed.
create or replace function public.redact_work_board_record(kind text, record uuid, by_whom uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not exists (
    select 1 from public.profiles p where p.id = by_whom and p.is_admin and p.erased_at is null
  ) then
    raise exception 'Only an administrator removes text on review';
  end if;

  perform set_config('app.redacting', 'on', true);
  if kind = 'message' then
    update public.work_messages
       set body = public.redacted_text('review'), redacted_at = now(),
           redacted_reason = 'review', redacted_by = by_whom
     where id = record and redacted_at is null;
  elsif kind = 'comment' then
    update public.work_comments
       set body = public.redacted_text('review'), redacted_at = now(),
           redacted_reason = 'review', redacted_by = by_whom
     where id = record and redacted_at is null;
  else
    raise exception 'Unknown kind of record';
  end if;
  get diagnostics n = row_count;
  perform set_config('app.redacting', '', true);
  return n > 0;
end;
$$;

revoke all on function public.redact_work_board_record(text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.redact_work_board_record(text, uuid, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 6. Ending every session
-- -----------------------------------------------------------------------------
-- Supabase Auth keeps sessions and refresh tokens in the auth schema. Deleting
-- them means no refresh token can be exchanged for a new access token. Guarded
-- by to_regclass so a plain Postgres without the auth server's tables (the
-- schema-guarantee test bed) still runs. refresh_tokens.user_id is text in
-- Supabase, hence the cast. Only for an account that is already erased.
create or replace function public.revoke_account_sessions(uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
  total integer := 0;
begin
  if not exists (select 1 from public.profiles where id = uid and erased_at is not null) then
    raise exception 'Sessions are revoked here only for a deleted account';
  end if;
  if to_regclass('auth.refresh_tokens') is not null then
    execute 'delete from auth.refresh_tokens where user_id = $1' using uid::text;
    get diagnostics n = row_count;
    total := total + n;
  end if;
  if to_regclass('auth.sessions') is not null then
    execute 'delete from auth.sessions where user_id = $1' using uid;
    get diagnostics n = row_count;
    total := total + n;
  end if;
  return total;
end;
$$;

revoke all on function public.revoke_account_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_account_sessions(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 7. The erasure, redefined
-- -----------------------------------------------------------------------------
-- 0043's erasure plus: the job row, the sessions, the person's own work-board
-- text, and the certification review. One transaction, so either all of the
-- database side happens or none of it. by_whom is who asked: the person
-- themselves or an administrator. Returns the recording paths it cleared
-- (also kept on the job as pending_files until the files are gone).
create or replace function public.erase_account(uid uuid, by_whom uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  who public.profiles%rowtype;
  recordings text[];
  erased_address text := 'erased-' || uid::text || '@invalid.invalid';
begin
  select * into who from public.profiles where id = uid for update;
  if not found then
    raise exception 'There is no such account';
  end if;
  if who.is_admin or who.is_coach or who.is_firm_admin then
    raise exception 'A staff account is not erased this way: take the staff role off first';
  end if;

  perform set_config('app.erasing', uid::text, true);

  select coalesce(array_agg(recording_path order by id), '{}') into recordings
    from public.matter_attempts
   where user_id = uid and recording_path is not null;
  update public.matter_attempts set recording_path = null
   where user_id = uid and recording_path is not null;

  -- Messages go with their conversation, by cascade.
  delete from public.tutor_conversations where user_id = uid;
  delete from public.code_attempts where user_id = uid;
  delete from public.access_grants where user_id = uid and decision is null;

  -- The invitation stays, so the firm still supervises the record (and
  -- counts its months); who it was addressed to does not.
  update public.joiner_invitations
     set email = erased_address, display_name = ''
   where accepted_by = uid;

  update public.profiles set
    display_name = 'Deleted account',
    email = erased_address,
    avatar_url = null,
    avatar_style = null,
    career_stage = null,
    improvement_goals = '{}',
    daily_goal_minutes = 10,
    timezone = case when country = 'MY' then 'Asia/Kuala_Lumpur' else 'Australia/Melbourne' end,
    leaderboard_opt_out = true,
    must_change_password = false,
    erased_at = coalesce(erased_at, now())
  where id = uid;

  perform set_config('app.erasing', '', true);

  -- The job. The former name is kept only on the first erasure (afterwards
  -- the profile already says "Deleted account") and only while the review is
  -- open.
  insert into public.account_erasures as j
    (user_id, requested_by, former_display_name, pending_files, database_done_at, sessions_done_at)
  values (
    uid,
    by_whom,
    case when who.erased_at is null then nullif(trim(who.display_name), '') end,
    recordings,
    now(),
    now()
  )
  on conflict (user_id) do update set
    pending_files = array(
      select distinct f from unnest(j.pending_files || excluded.pending_files) f order by f
    ),
    database_done_at = coalesce(j.database_done_at, excluded.database_done_at),
    sessions_done_at = excluded.sessions_done_at;

  -- Every session and refresh token, in this transaction.
  perform public.revoke_account_sessions(uid);

  -- Their own words on the work board, unless kept for supervision.
  perform set_config('app.redacting', 'on', true);
  update public.work_messages
     set body = public.redacted_text('erasure'), redacted_at = now(), redacted_reason = 'erasure'
   where sender_id = uid and redacted_at is null and not kept_for_supervision;
  update public.work_comments
     set body = public.redacted_text('erasure'), redacted_at = now(), redacted_reason = 'erasure'
   where author_id = uid and redacted_at is null and not kept_for_supervision;
  perform set_config('app.redacting', '', true);

  -- The certification register, for an administrator to decide.
  perform public.queue_certification_review(uid);

  return recordings;
end;
$$;

revoke all on function public.erase_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.erase_account(uuid, uuid) to service_role;

-- The one-argument form stays (erasing() and redacting() name it), and does
-- the same with nobody recorded as asking.
create or replace function public.erase_account(uid uuid)
returns text[]
language sql
security definer
set search_path = public
as $$
  select public.erase_account(uid, null::uuid);
$$;

revoke all on function public.erase_account(uuid) from public, anon, authenticated;
grant execute on function public.erase_account(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 8. The review: linking, deciding, finding, closing
-- -----------------------------------------------------------------------------
-- An administrator links a register record to an account, or unlinks it
-- (account null). Linking a deleted account whose review is still open queues
-- the record for a decision straight away.
create or replace function public.link_certification_trainee(trainee uuid, account uuid, by_whom uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.profiles%rowtype;
  job public.account_erasures%rowtype;
begin
  if not exists (
    select 1 from public.profiles p where p.id = by_whom and p.is_admin and p.erased_at is null
  ) then
    raise exception 'Only an administrator links a register record to an account';
  end if;
  if not exists (select 1 from public.certification_trainees where id = trainee) then
    raise exception 'There is no such register record';
  end if;

  if account is null then
    update public.certification_trainees set profile_id = null where id = trainee;
    return;
  end if;

  select * into target from public.profiles where id = account;
  if not found then
    raise exception 'There is no such account';
  end if;
  if target.is_admin or coalesce(target.is_coach, false) or target.is_firm_admin then
    raise exception 'A register record is for a trainee, not a member of staff';
  end if;
  if target.erased_at is not null then
    select * into job from public.account_erasures where user_id = account;
    if not found or job.review_closed_at is not null then
      raise exception 'That account was deleted and its review is closed';
    end if;
  end if;

  update public.certification_trainees set profile_id = account where id = trainee;
  if target.erased_at is not null then
    perform public.queue_certification_review(account);
  end if;
end;
$$;

revoke all on function public.link_certification_trainee(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.link_certification_trainee(uuid, uuid, uuid) to service_role;

-- Deciding one review item. Redacting clears what may identify the person:
-- on the trainee record the name becomes "Deleted account" and the notes
-- empty; on an entry the matter reference becomes "Removed" and the court
-- reference, case type and note empty. Grades, dates, box numbers, the firm
-- and the screening tick stay. Retaining needs a reason.
create or replace function public.decide_erasure_review_item(item uuid, decision text, reason text, by_whom uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_item public.erasure_review_items%rowtype;
begin
  if not exists (
    select 1 from public.profiles p where p.id = by_whom and p.is_admin and p.erased_at is null
  ) then
    raise exception 'Only an administrator decides a review item';
  end if;
  select * into target_item from public.erasure_review_items where id = item for update;
  if not found then
    raise exception 'There is no such review item';
  end if;
  if target_item.decision is not null then
    raise exception 'That review item has already been decided';
  end if;
  if decision not in ('redact', 'retain') then
    raise exception 'Redact or retain';
  end if;
  if decision = 'retain' and length(trim(coalesce(reason, ''))) < 3 then
    raise exception 'Say why it is retained';
  end if;

  if decision = 'redact' then
    if target_item.certification_trainee_id is not null then
      update public.certification_trainees
         set full_name = 'Deleted account', notes = ''
       where id = target_item.certification_trainee_id;
    else
      update public.certification_entries
         set case_no = 'Removed', court_file_ref = '', case_type_stage = '', note = ''
       where id = target_item.certification_entry_id;
    end if;
  end if;

  update public.erasure_review_items
     set decision = decide_erasure_review_item.decision,
         reason = nullif(trim(coalesce(decide_erasure_review_item.reason, '')), ''),
         decided_by = by_whom
   where id = item;
end;
$$;

revoke all on function public.decide_erasure_review_item(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.decide_erasure_review_item(uuid, text, text, uuid) to service_role;

-- What may still identify a deleted person, for the review. Their own written
-- work stays as the firm's record and is listed so somebody looks at it; the
-- searches for their former name run only while the review is open, because
-- the name is cleared when it closes. can_redact says whether the page offers
-- "Redact" (work-board text only: everything else is a frozen record or is
-- decided in the certification queue).
create or replace function public.erasure_identifying_records(uid uuid)
returns table (kind text, record_id uuid, post_id uuid, excerpt text, happened_at timestamptz, can_redact boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  full_name text;
  first_name text;
  pattern_full text;
  pattern_first text;
begin
  select nullif(trim(j.former_display_name), '') into full_name
    from public.account_erasures j where j.user_id = uid and j.review_closed_at is null;
  if full_name is not null then
    pattern_full := '%' || replace(replace(replace(full_name, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    first_name := split_part(full_name, ' ', 1);
    if length(first_name) >= 3 and first_name <> full_name then
      pattern_first := '%' || replace(replace(replace(first_name, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    end if;
  end if;

  return query
  -- Their own messages and comments still showing: kept for supervision, or
  -- from a deletion before this migration.
  select 'own_message'::text, m.id, m.post_id, left(m.body, 200),
         m.sent_at, true
    from public.work_messages m
   where m.sender_id = uid and m.redacted_at is null
  union all
  select 'own_comment', c.id, c.post_id, left(c.body, 200), c.created_at, true
    from public.work_comments c
   where c.author_id = uid and c.redacted_at is null
  union all
  -- Somebody else's words that name them.
  select 'mention_message', m.id, m.post_id, left(m.body, 200), m.sent_at, true
    from public.work_messages m
   where full_name is not null
     and m.sender_id is distinct from uid and m.redacted_at is null
     and (m.body ilike pattern_full or (pattern_first is not null and m.body ilike pattern_first))
  union all
  select 'mention_comment', c.id, c.post_id, left(c.body, 200), c.created_at, true
    from public.work_comments c
   where full_name is not null
     and c.author_id is distinct from uid and c.redacted_at is null
     and (c.body ilike pattern_full or (pattern_first is not null and c.body ilike pattern_first))
  union all
  -- What they handed in on the work board: the file, its name and their note.
  select 'submission', s.id, s.post_id,
         left(trim(s.file_name || ' ' || coalesce(s.note, '')), 200), s.submitted_at, false
    from public.work_submissions s
   where s.user_id = uid
  union all
  -- A coach's feedback on anybody's hand-in that names them.
  select 'feedback_mention', s.id, s.post_id, left(s.feedback, 200), s.marked_at, false
    from public.work_submissions s
   where full_name is not null and s.feedback is not null
     and (s.feedback ilike pattern_full or (pattern_first is not null and s.feedback ilike pattern_first))
  union all
  -- Their written answers on matters, and the mark.
  select 'matter_answer', a.id, null::uuid,
         left(trim(coalesce(a.draft_answer, '') || ' ' || coalesce(a.procedure_answer, '')), 200),
         coalesce(a.submitted_at, a.started_at), false
    from public.matter_attempts a
   where a.user_id = uid
     and (coalesce(a.draft_answer, '') ~ '\S' or coalesce(a.procedure_answer, '') ~ '\S'
          or coalesce(a.feedback, '') ~ '\S')
  union all
  -- A supervisor's note on their joining decision.
  select 'onboarding_note', d.id, null::uuid, left(d.note, 200), d.decided_at, false
    from public.onboarding_decisions d
   where d.user_id = uid and coalesce(d.note, '') ~ '\S'
  union all
  -- The academy's certificate of completion.
  select 'certificate', c.id, null::uuid, 'Certificate of completion'::text, c.issued_at, false
    from public.certificates c
   where c.user_id = uid
  union all
  -- The certification register: decided in the review queue.
  select 'certification_trainee', t.id, null::uuid, left(t.full_name || ', ' || t.firm_name, 200),
         t.created_at, false
    from public.certification_trainees t
   where t.profile_id = uid
  union all
  select 'certification_entry', e.id, null::uuid,
         left('Box ' || e.box_number || ': ' || e.case_no, 200), e.created_at, false
    from public.certification_entries e
    join public.certification_trainees t on t.id = e.trainee_id
   where t.profile_id = uid;
end;
$$;

revoke all on function public.erasure_identifying_records(uuid) from public, anon, authenticated;
grant execute on function public.erasure_identifying_records(uuid) to service_role;

-- Closing the review: only once every certification item is decided. The
-- former name goes with it.
create or replace function public.close_erasure_review(uid uuid, by_whom uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p where p.id = by_whom and p.is_admin and p.erased_at is null
  ) then
    raise exception 'Only an administrator closes a review';
  end if;
  if not exists (select 1 from public.account_erasures where user_id = uid and database_done_at is not null) then
    raise exception 'There is no deletion to review';
  end if;
  if exists (select 1 from public.erasure_review_items where user_id = uid and decision is null) then
    raise exception 'Every certification record has to be decided before the review closes';
  end if;
  update public.account_erasures
     set review_closed_at = now(), review_closed_by = by_whom, former_display_name = null
   where user_id = uid and review_closed_at is null;
end;
$$;

revoke all on function public.close_erasure_review(uuid, uuid) from public, anon, authenticated;
grant execute on function public.close_erasure_review(uuid, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 9. Refusing a deleted account at the door
-- -----------------------------------------------------------------------------
-- Whether whoever is asking has a deleted account. A primary key lookup.
-- Security definer so it can read the profile past its own policies (and so a
-- policy on profiles can call it without going round in a circle). Nobody
-- signed in, or no profile, is not deleted.
create or replace function public.caller_erased()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.erased_at is not null from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.caller_erased() from public;
grant execute on function public.caller_erased() to anon, authenticated, service_role;

-- Run by PostgREST before every request. It must never fail for any reason
-- other than a deleted account, or it would take the whole site down: a
-- missing profile, nobody signed in or anything unexpected lets the request
-- through, and the policies and the app's own checks still apply.
create or replace function public.check_request()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  erased boolean := false;
begin
  begin
    erased := public.caller_erased();
  exception when others then
    erased := false;
  end;
  if erased then
    raise exception using
      errcode = '42501',
      message = 'This account has been deleted and can no longer be used.',
      hint = 'Sign out. A deleted account cannot be signed in to again.';
  end if;
end;
$$;

revoke all on function public.check_request() from public;
grant execute on function public.check_request() to anon, authenticated, service_role;

-- Tells PostgREST to run check_request before every request. Only where the
-- authenticator role exists (a Supabase project); a plain Postgres has none.
-- Kept as a function so the schema guarantees can prove it registers.
create or replace function public.register_request_check()
returns boolean
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    return false;
  end if;
  execute 'alter role authenticator set pgrst.db_pre_request = ''public.check_request''';
  notify pgrst, 'reload config';
  return true;
end;
$$;

revoke all on function public.register_request_check() from public, anon, authenticated, service_role;

select public.register_request_check();

-- A restrictive policy on every table with Row Level Security, and on
-- storage.objects, refusing a deleted account whatever the other policies
-- allow. A function, so the end of SETUP.sql and UPDATE.sql can run it again
-- after every later migration and a table added after this one is covered
-- too. Returns how many tables it covered.
--
-- The check is a plain call, not wrapped in "(select ...)". Wrapped, it is a
-- subquery, and Postgres refuses ("infinite recursion detected in policy")
-- any table whose policies are reached from another table's policy, such as
-- work_claims from work_posts. Unwrapped, it runs once per row, which is a
-- primary key lookup on profiles each time.
create or replace function public.refuse_erased_callers()
returns integer
language plpgsql
set search_path = public
as $$
declare
  t record;
  covered integer := 0;
begin
  for t in
    select n.nspname as schema_name, c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where c.relkind in ('r', 'p')
       and c.relrowsecurity
       and (n.nspname = 'public' or (n.nspname = 'storage' and c.relname = 'objects'))
  loop
    execute format('drop policy if exists erased_account_refused on %I.%I', t.schema_name, t.table_name);
    execute format(
      'create policy erased_account_refused on %I.%I as restrictive for all to authenticated using (not public.caller_erased()) with check (not public.caller_erased())',
      t.schema_name, t.table_name
    );
    covered := covered + 1;
  end loop;
  return covered;
end;
$$;

revoke all on function public.refuse_erased_callers() from public, anon, authenticated, service_role;

select public.refuse_erased_callers();

-- -----------------------------------------------------------------------------
-- 10. Deletions made before this migration
-- -----------------------------------------------------------------------------
-- An account deleted under 0043 has no job. It gets one, with the database
-- step dated when it happened and its sessions revoked now, so the daily job
-- makes sure sign-in is closed and the files are gone. Its former name was
-- never kept, so its review finds only what is linked to the account.
insert into public.account_erasures (user_id, requested_at, database_done_at)
select p.id, p.erased_at, p.erased_at
  from public.profiles p
 where p.erased_at is not null
   and not exists (select 1 from public.account_erasures j where j.user_id = p.id);

do $$
declare
  j record;
begin
  for j in select user_id from public.account_erasures where sessions_done_at is null loop
    perform public.revoke_account_sessions(j.user_id);
    update public.account_erasures set sessions_done_at = now() where user_id = j.user_id;
  end loop;
end
$$;
