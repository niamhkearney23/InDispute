-- =============================================================================
-- Before the update: what is in the database now
-- =============================================================================
-- Paste into the Supabase SQL editor and press Run BEFORE pasting UPDATE.sql.
-- It changes nothing. Keep the result (a screenshot is fine): after the
-- update, after-update.sql prints the same counts, and every one should be
-- the same, except "published questions" and "published daily facts", which
-- go down by however many were published without a lawyer's sign-off.
-- =============================================================================

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
union all select 'stored files', count(*)::text from storage.objects;
