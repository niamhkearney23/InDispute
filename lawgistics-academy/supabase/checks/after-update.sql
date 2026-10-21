-- =============================================================================
-- After the update: is everything as it should be?
-- =============================================================================
-- Paste into the Supabase SQL editor and press Run AFTER UPDATE.sql has said
-- "Success". It changes nothing. The first lines are checks and should all
-- say OK. The lines after them are the same counts before-update.sql gave
-- you, to compare. (The SQL editor shows only one result, so it is all one
-- table.)
-- =============================================================================

with checks(n, what, ok) as (
  values
  (1, 'The database is at the version the website expects (0051)',
     (select public.schema_version()) = '0051'),

  (2, 'No question is published without a lawyer''s sign-off on its current wording',
     not exists (
       select 1 from public.questions q
        where q.status = 'published'
          and not exists (select 1 from public.question_versions v
                           where v.question_id = q.id and v.is_current
                             and v.verification_status = 'human_verified'))),

  (3, 'No daily fact is published without a lawyer''s sign-off',
     not exists (select 1 from public.daily_facts
                  where status = 'published' and verification_status <> 'human_verified')),

  (4, 'Publishing without a sign-off is refused (the three guards are in place)',
     (select count(*) from pg_trigger
       where tgname in ('questions_publish_gate', 'question_versions_publish_gate', 'daily_facts_publish_gate')
         and not tgisinternal) = 3),

  (5, 'Learners are given only signed-off questions and facts',
     pg_get_viewdef('public.v_question_delivery'::regclass) like '%human_verified%'
     and exists (select 1 from pg_policies
                  where tablename = 'daily_facts' and policyname = 'daily_facts_read_published'
                    and qual like '%human_verified%')),

  (6, 'A staff role counts only once the six-digit code has been typed',
     pg_get_functiondef('public.is_admin()'::regprocedure) like '%staff_session_checked%'
     and pg_get_functiondef('public.is_coach()'::regprocedure) like '%staff_session_checked%'
     and pg_get_functiondef('public.is_firm_admin()'::regprocedure) like '%staff_session_checked%'),

  (7, 'Account deletion is installed and only the server can run it',
     to_regprocedure('public.erase_account(uuid)') is not null
     and not has_function_privilege('authenticated', 'public.erase_account(uuid)', 'execute')
     and not has_function_privilege('anon', 'public.erase_account(uuid)', 'execute')),

  (8, 'Every table has row level security switched on',
     not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity)),

  (9, 'A deleted account is refused on every request, whatever sign-in says',
     exists (select 1 from pg_roles
              where rolname = 'authenticator'
                and 'pgrst.db_pre_request=public.check_request' = any (rolconfig))),

  (10, 'Every table also refuses a deleted account (the backstop rule)',
     not exists (
       select 1 from pg_tables t
        where t.schemaname = 'public' and t.rowsecurity
          and not exists (select 1 from pg_policies p
                           where p.schemaname = 'public' and p.tablename = t.tablename
                             and p.policyname = 'erased_account_refused' and p.permissive = 'RESTRICTIVE'))),

  (11, 'Deletions are recorded step by step, and only the server can read them',
     to_regclass('public.account_erasures') is not null
     and not has_table_privilege('authenticated', 'public.account_erasures', 'select')
     and not has_table_privilege('anon', 'public.account_erasures', 'select')),

  (12, 'Lessons, court maps and essays have their lawyer sign-off record',
     to_regclass('public.content_signoffs') is not null
     and not has_table_privilege('anon', 'public.content_signoffs', 'select')),

  (13, 'A matter reaches learners only with a lawyer''s sign-off',
     exists (select 1 from pg_policies where tablename = 'matters' and policyname = 'matters_read'
              and qual like '%verified_by%')),

  (14, 'Every nightly deletion check is recorded, and only the server can read the record',
     to_regclass('public.operational_runs') is not null
     and not has_table_privilege('authenticated', 'public.operational_runs', 'select')
     and not has_table_privilege('anon', 'public.operational_runs', 'select')),

  (15, 'A coach''s morning note is never deleted and stays in its author''s name',
     to_regclass('public.morning_notes') is not null
     and exists (select 1 from pg_trigger where tgname = 'morning_notes_no_delete' and not tgisinternal)
     and exists (select 1 from pg_trigger where tgname = 'morning_notes_no_truncate' and not tgisinternal)
     and exists (select 1 from pg_trigger where tgname = 'morning_notes_guard' and not tgisinternal)),

  (16, 'A sign-off past its date stops the question or fact, and no table can be emptied by the app',
     (select pg_get_viewdef('public.v_question_delivery'::regclass) like '%review_due_on%')
     and exists (select 1 from pg_policies where tablename = 'daily_facts'
                  and policyname = 'daily_facts_read_published' and qual like '%review_due_on%')
     and not exists (
       select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace,
              unnest(array['anon', 'authenticated', 'service_role']) as r(role)
        where n.nspname = 'public' and c.relkind in ('r', 'p')
          and has_table_privilege(r.role, c.oid, 'TRUNCATE'))
     and not has_table_privilege('service_role', 'public.account_erasures', 'DELETE')
     and not has_table_privilege('service_role', 'public.content_signoffs', 'DELETE'))
)
select n as "#", what as "check", case when ok then 'OK' else 'NOT OK' end as result
from checks
union all
select 100 + row_number() over (), 'Count: ' || what, how_many
from (
  select 'people (sign-in accounts)' as what, count(*)::text as how_many from auth.users
  union all select 'profiles', count(*)::text from public.profiles
  union all select 'questions', count(*)::text from public.questions
  union all select 'question versions', count(*)::text from public.question_versions
  union all select 'published questions', count(*)::text from public.questions where status = 'published'
  union all select 'published questions with a lawyer''s sign-off', count(*)::text
    from public.questions q
    where q.status = 'published'
      and exists (select 1 from public.question_versions v
                   where v.question_id = q.id and v.is_current and v.verification_status = 'human_verified')
  union all select 'daily facts', count(*)::text from public.daily_facts
  union all select 'published daily facts', count(*)::text from public.daily_facts where status = 'published'
  union all select 'answers given', count(*)::text from public.user_question_attempts
  union all select 'training sessions', count(*)::text from public.training_sessions
  union all select 'work handed in', count(*)::text from public.work_submissions
  union all select 'work-board messages', count(*)::text from public.work_messages
  union all select 'matter attempts', count(*)::text from public.matter_attempts
  union all select 'certification entries', count(*)::text from public.certification_entries
  union all select 'certificates', count(*)::text from public.certificates
  union all select 'stored files', count(*)::text from storage.objects
) counts
order by 1;
