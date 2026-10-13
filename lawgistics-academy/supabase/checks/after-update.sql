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
  (1, 'The database is at the version the website expects (0047)',
     (select public.schema_version()) = '0047'),

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
     not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity))
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
