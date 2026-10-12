-- =============================================================================
-- Account erasure: a person can leave, and the firm keeps its training records
-- =============================================================================
-- Until now nobody could delete their account. Deleting the auth user would
-- cascade into user_question_attempts, whose trigger refuses every delete, and
-- into the firm-half records, which are append-only for everybody. Malaysia's
-- PDPA gives a person the right to ask, and Apple requires a way out of any
-- phone app, so there has to be one.
--
-- The owner's decision: anonymise, do not destroy what the firm relies on.
-- The account stays as a row with no identity in it, and is banned at the
-- auth server so it can never be signed in to again (done by the server,
-- src/lib/account/erasure.ts, which also changes the sign-in email and
-- password and deletes the stored files).
--
-- What goes, because it is the person and not the firm's record:
--   * the name, email, photo and cartoon, timezone, goals and career stage on
--     the profile (the name becomes "Deleted account");
--   * tutor conversations and their messages;
--   * wrong-code attempts (code_attempts);
--   * a request to join on a firm's code that nobody has decided yet;
--   * matter recordings: a voice is the person, so the file is deleted and
--     the column emptied, even on a matter already handed in;
--   * the email and name on the invitation they accepted.
-- There is no push or device token table to clear.
--
-- What stays, linked only to the anonymised id, because it is the firm's
-- training record: answers, homework declarations, work claims, submissions
-- and their files, the work-board messages and comments, matter attempts
-- (the written answers and the mark), onboarding acknowledgements,
-- declarations, confirmations and decisions, certificates, XP, mastery and
-- streaks. Their content is the person's work, not their identity. This is
-- a choice the owner can change: anything listed here can be added to
-- erase_account below with a matching guard exception.
--
-- Not touched: the certification register (certification_trainees). It is
-- typed by a coach and not linked to any account, so a name there has to be
-- removed by the coach by hand.
--
-- Staff accounts are refused: take the staff role off at Admin, Staff first.
-- =============================================================================

alter table public.profiles add column if not exists erased_at timestamptz;

-- -----------------------------------------------------------------------------
-- 1. The erasure itself, one transaction, the server only
-- -----------------------------------------------------------------------------
-- Security definer so it can do, inside the guards, what nobody can do
-- through the API. The guards below recognise it by two things together: a
-- transaction-local setting naming the person being erased, and the current
-- user being this function's owner, which only happens inside a security
-- definer function it owns (or for the database owner, who can do anything
-- anyway). A client that sets the setting itself is still `authenticated`
-- or `service_role`, and is refused.
--
-- Running it twice is safe and changes nothing the first run did not, so the
-- server can retry deleting files. It returns the recording paths it cleared.
create or replace function public.erase_account(uid uuid)
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
  return recordings;
end;
$$;

revoke all on function public.erase_account(uuid) from public;
revoke all on function public.erase_account(uuid) from anon;
revoke all on function public.erase_account(uuid) from authenticated;
grant execute on function public.erase_account(uuid) to service_role;

-- Whether this row is being erased right now, by erase_account. Not security
-- definer: it has to see the caller's own current_user to tell the function
-- apart from a client that set the same setting.
create or replace function public.erasing(uid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select uid is not null
    and coalesce(current_setting('app.erasing', true), '') = uid::text
    and current_user = (
      select pg_get_userbyid(p.proowner) from pg_proc p
      where p.oid = 'public.erase_account(uuid)'::regprocedure
    );
$$;

-- -----------------------------------------------------------------------------
-- 2. Erased stays erased
-- -----------------------------------------------------------------------------
-- Nobody sets erased_at but erase_account, and once set nobody clears or
-- moves it, the service role and administrators included. The name, email
-- and picture it cleared stay cleared, and an erased account is never made
-- staff, so there is no way back to a person through this row.
create or replace function public.guard_profile_erasure()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.erased_at := null;
    return new;
  end if;

  if old.erased_at is not null then
    if new.erased_at is distinct from old.erased_at then
      raise exception 'An erased account stays erased';
    end if;
    if new.display_name is distinct from old.display_name
       or new.email is distinct from old.email
       or new.avatar_url is distinct from old.avatar_url
       or new.avatar_style is distinct from old.avatar_style then
      raise exception 'An erased account''s name, email and picture stay cleared';
    end if;
    if (new.is_admin and not old.is_admin)
       or (new.is_coach and not old.is_coach)
       or (new.is_firm_admin and not old.is_firm_admin) then
      raise exception 'An erased account cannot be made staff';
    end if;
    return new;
  end if;

  if new.erased_at is not null and not public.erasing(old.id) then
    raise exception 'An account is erased only by erase_account';
  end if;
  return new;
end;
$$;

create or replace trigger profiles_guard_erasure
  before insert or update on public.profiles
  for each row execute function public.guard_profile_erasure();

-- -----------------------------------------------------------------------------
-- 3. The two frozen records erasure has to reach into
-- -----------------------------------------------------------------------------
-- A handed-in matter is frozen (0039, 0040). Erasure may empty its recording
-- and nothing else: every other column must come out exactly as it went in.
-- Otherwise redefined whole from its 0040 body.
create or replace function public.guard_matter_attempt()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.erasing(old.user_id)
     and new.recording_path is null
     and (to_jsonb(new) - 'recording_path') = (to_jsonb(old) - 'recording_path') then
    return new;
  end if;

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

-- A tutor conversation went only with the account (0031). The account now
-- stays, so erasure deletes the conversation itself; its messages still go
-- by cascade. Otherwise redefined whole from its 0031 body.
create or replace function public.stamp_tutor_row()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    return new;
  end if;
  if tg_op = 'DELETE' and (pg_trigger_depth() > 1 or public.erasing(old.user_id)) then
    return old;
  end if;
  raise exception 'tutor conversations are kept as they were said';
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Names
-- -----------------------------------------------------------------------------
-- On the work board an erased person reads "Deleted account", not "Deleted".
-- The address is set only by erase_account and a learner cannot change their
-- own (0024). Otherwise redefined whole from its 0026 body.
create or replace function public.shown_first_name(display_name text, email text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when email like 'erased-%@invalid.invalid' then 'Deleted account'
    when nullif(trim(display_name), '') is null then 'Someone'
    when display_name like '%@%' then 'Someone'
    when lower(trim(display_name)) = lower(split_part(coalesce(email, ''), '@', 1)) then 'Someone'
    else split_part(trim(display_name), ' ', 1)
  end;
$$;

-- An erased account is not on the leaderboard, whatever its opt-out says.
-- Redefined whole from its 0037 body.
create or replace function public.weekly_leaderboard()
returns table (place integer, first_name text, xp integer, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      p.id,
      -- A first name, or "Someone". A display name that is really the
      -- email's local part (what sign-up fills in when no name is given)
      -- is not a first name and would put the email on every dashboard.
      case
        when nullif(trim(p.display_name), '') is null then 'Someone'
        when p.display_name like '%@%' then 'Someone'
        when lower(trim(p.display_name)) = lower(split_part(coalesce(p.email, ''), '@', 1)) then 'Someone'
        else split_part(trim(p.display_name), ' ', 1)
      end as first_name,
      coalesce(sum(x.amount), 0)::integer as xp
    from public.profiles p
    left join public.xp_events x
      on x.user_id = p.id
     and x.created_at >= now() - interval '7 days'
    where not p.is_admin
      and not coalesce(p.is_coach, false)
      and not p.is_firm_admin
      and not p.leaderboard_opt_out
      and p.erased_at is null
    group by p.id, p.display_name
  ),
  ranked as (
    select id, first_name, xp,
           rank() over (order by xp desc, first_name asc, id asc)::integer as place
    from totals
    where xp > 0
  )
  select place, first_name, xp, id = auth.uid() as is_me
  from ranked
  where auth.uid() is not null
    and (select leaderboard_enabled from public.firm_settings where id)
    and (place <= 10 or id = auth.uid())
  order by place;
$$;
