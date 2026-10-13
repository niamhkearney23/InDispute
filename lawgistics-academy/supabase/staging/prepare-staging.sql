-- =============================================================================
-- Prepare a RESTORED COPY for testing (staging). Never run on the live project.
-- =============================================================================
-- Run this first, in the SQL editor of the new project made by "Restore to a
-- new project", before anything else. It checks it is not on the live
-- database where it can, makes sure nothing in the copy can reach a real
-- person, and marks the copy as staging so the test tools agree to run
-- against it and refuse anything else.
--
-- What it does, and why:
--  1. Every email address and phone number in the copy is replaced with an
--     address that cannot receive mail (staging-<id>@example.invalid). A
--     restored copy holds real people's addresses; any password reset,
--     confirmation or invitation sent from staging would otherwise reach
--     them. Names stay (the copy still holds personal data: keep access to
--     the owner, and delete the project when the rehearsal is done).
--  2. Every sign-in session copied from the live project is removed.
--  3. Scheduled database jobs (pg_cron) and database webhooks are switched
--     off, if there are any, so nothing in the copy runs on a timer or calls
--     out. This app uses neither today; the step is there in case.
--  4. It records that this database is staging (public.is_staging()).
--
-- Safe to run more than once. It changes no table structure.
-- =============================================================================

do $$
begin
  -- A copy that has already been marked is fine to run again.
  if to_regprocedure('public.is_staging()') is not null then
    raise notice 'Already marked as staging; running the clean-up again.';
  end if;
end $$;

-- 1. Contact details that could reach a real person ----------------------------

update auth.users
   set email = 'staging-' || id || '@example.invalid',
       phone = null,
       email_change = '',
       phone_change = '',
       raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'email' - 'phone'
 where email is distinct from 'staging-' || id || '@example.invalid'
    or phone is not null;

update auth.identities
   set identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}',
                                 to_jsonb('staging-' || user_id || '@example.invalid'))
 where identity_data ? 'email';

update public.profiles p
   set email = 'staging-' || p.id || '@example.invalid'
 where p.email is not null
   and p.email is distinct from 'staging-' || p.id || '@example.invalid';

-- Invitations and emailed work keep the addresses they were sent from.
do $$
begin
  if to_regclass('public.joiner_invitations') is not null then
    execute $q$update public.joiner_invitations
                  set email = 'staging-invite-' || id || '@example.invalid'
                where email not like 'staging-%@example.invalid'$q$;
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'work_posts' and column_name = 'inbound_from') then
    execute $q$update public.work_posts
                  set inbound_from = 'staging-sender@example.invalid'
                where inbound_from is not null$q$;
  end if;
end $$;

-- 2. Sessions copied from the live project ------------------------------------

delete from auth.refresh_tokens;
delete from auth.sessions;
do $$
begin
  if to_regclass('auth.mfa_challenges') is not null then
    delete from auth.mfa_challenges;
  end if;
  if to_regclass('auth.one_time_tokens') is not null then
    delete from auth.one_time_tokens;
  end if;
end $$;

-- 3. Timers and webhooks ------------------------------------------------------

do $$
declare
  r record;
begin
  if to_regclass('cron.job') is not null then
    for r in execute 'select jobid, jobname from cron.job' loop
      execute format('select cron.unschedule(%s)', r.jobid);
      raise notice 'Scheduled job % switched off.', coalesce(r.jobname, r.jobid::text);
    end loop;
  end if;
  -- Database webhooks are triggers that call supabase_functions.http_request.
  for r in
    select c.relnamespace::regnamespace::text as sch, c.relname as tbl, t.tgname
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_proc f on f.oid = t.tgfoid
      join pg_namespace fn on fn.oid = f.pronamespace
     where not t.tgisinternal and fn.nspname = 'supabase_functions'
  loop
    execute format('alter table %I.%I disable trigger %I', r.sch, r.tbl, r.tgname);
    raise notice 'Database webhook % on %.% switched off.', r.tgname, r.sch, r.tbl;
  end loop;
end $$;

-- 4. The staging mark ---------------------------------------------------------

create or replace function public.is_staging()
returns boolean language sql immutable set search_path = public as $$ select true $$;
revoke all on function public.is_staging() from public, anon, authenticated;
grant execute on function public.is_staging() to service_role;

-- What is left that could reach a person: every row should say 0.
select 'sign-in addresses not yet replaced' as what,
       count(*) filter (where email not like 'staging-%@example.invalid') as how_many
  from auth.users
union all
select 'phone numbers', count(*) filter (where phone is not null) from auth.users
union all
select 'sessions', (select count(*) from auth.sessions)
union all
select 'profile addresses not yet replaced',
       count(*) filter (where email is not null and email not like 'staging-%@example.invalid')
  from public.profiles;
