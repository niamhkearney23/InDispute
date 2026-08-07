-- =============================================================================
-- Schema guarantee tests
-- =============================================================================
-- Exercises the promises the schema makes, against a real Postgres:
--
--   * a new auth user gets a profile and a streak row
--   * question content is immutable once written
--   * attempts are append-only
--   * a learner cannot make themselves an administrator
--   * a learner cannot read another learner's attempts
--   * the delivery view never exposes an answer key, and never exposes a
--     question that has not been published
--   * only one version of a question can be current
--
-- Run against a database that already has 0001_init.sql applied:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/schema-guarantees.sql
--
-- Any failure raises and aborts. Success prints a list of passing checks.
-- The script rolls itself back, so it leaves no data behind.
-- =============================================================================

begin;

\set QUIET on
\pset tuples_only on

create or replace function pg_temp.expect_failure(stmt text, label text)
returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'PASS  %  (blocked: %)', label, left(sqlerrm, 60);
    return;
  end;
  raise exception 'FAIL  % — the statement was allowed when it should have been blocked', label;
end;
$$;

create or replace function pg_temp.expect(condition boolean, label text)
returns void language plpgsql as $$
begin
  if condition then
    raise notice 'PASS  %', label;
  else
    raise exception 'FAIL  %', label;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Fixtures
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'learner-a@example.test', '{"display_name":"A"}'),
  ('22222222-2222-2222-2222-222222222222', 'learner-b@example.test', '{}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@example.test', '{}');

select pg_temp.expect(
  (select count(*) from public.profiles
   where id in ('11111111-1111-1111-1111-111111111111',
                '22222222-2222-2222-2222-222222222222',
                '33333333-3333-3333-3333-333333333333')) = 3,
  'a profile is created for every new auth user');

select pg_temp.expect(
  (select count(*) from public.user_streaks) = 3,
  'a streak row is created for every new auth user');

update public.profiles set is_admin = true
where id = '33333333-3333-3333-3333-333333333333';

insert into public.domains (id, slug, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'test-domain', 'Test Domain');

insert into public.concepts (id, domain_id, slug, name)
values ('bbbbbbbb-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001', 'test-concept', 'Test Concept');

insert into public.questions (id, slug, domain_id, status)
values ('cccccccc-0000-0000-0000-000000000001', 'test-question',
        'aaaaaaaa-0000-0000-0000-000000000001', 'published'),
       ('cccccccc-0000-0000-0000-000000000002', 'draft-question',
        'aaaaaaaa-0000-0000-0000-000000000001', 'draft');

insert into public.question_versions
  (id, question_id, version, question_type, stem, options, correct_option_ids,
   explanation, difficulty, jurisdiction)
values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 1,
   'multiple_choice', 'Published question?',
   '[{"id":"a","text":"Yes"},{"id":"b","text":"No"}]', array['a'],
   'Because yes.', 2, 'VIC'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', 1,
   'multiple_choice', 'Draft question?',
   '[{"id":"a","text":"Yes"},{"id":"b","text":"No"}]', array['a'],
   'Because yes.', 2, 'NSW');

-- -----------------------------------------------------------------------------
-- Content immutability
-- -----------------------------------------------------------------------------
select pg_temp.expect_failure(
  $$update public.question_versions set stem = 'Rewritten'
    where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  'the stem of a question version cannot be rewritten');

select pg_temp.expect_failure(
  $$update public.question_versions set correct_option_ids = array['b']
    where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  'the answer key of a question version cannot be rewritten');

select pg_temp.expect_failure(
  $$update public.question_versions set jurisdiction = 'NSW'
    where id = 'dddddddd-0000-0000-0000-000000000001'$$,
  'the jurisdiction of a question version cannot be rewritten');

-- ...but explanatory text and verification metadata may be corrected in place.
update public.question_versions
set explanation = 'A clearer explanation.',
    verification_status = 'human_verified'
where id = 'dddddddd-0000-0000-0000-000000000001';

select pg_temp.expect(
  (select explanation from public.question_versions
   where id = 'dddddddd-0000-0000-0000-000000000001') = 'A clearer explanation.',
  'explanation and verification status can still be corrected in place');

-- -----------------------------------------------------------------------------
-- One current version per question
-- -----------------------------------------------------------------------------
select pg_temp.expect_failure(
  $$insert into public.question_versions
      (question_id, version, is_current, question_type, stem, options,
       correct_option_ids, explanation, difficulty, jurisdiction)
    values ('cccccccc-0000-0000-0000-000000000001', 2, true, 'multiple_choice',
            'Second current version?',
            '[{"id":"a","text":"Yes"}]', array['a'], 'x', 2, 'VIC')$$,
  'a question cannot have two current versions');

-- -----------------------------------------------------------------------------
-- Attempts are append-only
-- -----------------------------------------------------------------------------
insert into public.user_question_attempts
  (id, user_id, question_id, question_version_id, selected_option_ids, is_correct)
values ('eeeeeeee-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'cccccccc-0000-0000-0000-000000000001',
        'dddddddd-0000-0000-0000-000000000001',
        array['a'], true);

select pg_temp.expect_failure(
  $$update public.user_question_attempts set is_correct = false
    where id = 'eeeeeeee-0000-0000-0000-000000000001'$$,
  'a recorded attempt cannot be altered');

select pg_temp.expect_failure(
  $$delete from public.user_question_attempts
    where id = 'eeeeeeee-0000-0000-0000-000000000001'$$,
  'a recorded attempt cannot be deleted');

-- -----------------------------------------------------------------------------
-- Delivery view
-- -----------------------------------------------------------------------------
select pg_temp.expect(
  not exists (
    select 1 from information_schema.columns
    where table_name = 'v_question_delivery'
      and column_name in ('correct_option_ids', 'explanation', 'why_it_matters',
                          'common_misconception', 'memory_trick')),
  'the delivery view exposes no answer key and no explanatory text');

select pg_temp.expect(
  (select count(*) from public.v_question_delivery) = 1,
  'the delivery view exposes published questions only');

-- -----------------------------------------------------------------------------
-- Row Level Security, as a signed-in learner
-- -----------------------------------------------------------------------------
grant select on public.v_question_delivery to authenticated;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select pg_temp.expect(
  (select count(*) from public.profiles) = 1,
  'a learner sees only their own profile');

select pg_temp.expect_failure(
  $$update public.profiles set is_admin = true
    where id = '11111111-1111-1111-1111-111111111111'$$,
  'a learner cannot make themselves an administrator');

select pg_temp.expect(
  (select count(*) from public.questions) = 0,
  'a learner cannot read the questions table directly');

select pg_temp.expect(
  (select count(*) from public.question_versions) = 0,
  'a learner cannot read question versions directly — that is where the answers live');

select pg_temp.expect(
  (select count(*) from public.v_question_delivery) = 1,
  'a learner can read the delivery view');

select pg_temp.expect(
  (select count(*) from public.user_question_attempts) = 1,
  'a learner sees their own attempts');

-- Now as the other learner: the same attempt must be invisible.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select pg_temp.expect(
  (select count(*) from public.user_question_attempts) = 0,
  'a learner cannot see another learner’s attempts');

select pg_temp.expect(
  (select count(*) from public.profiles) = 1,
  'a learner cannot see another learner’s profile');

select pg_temp.expect_failure(
  $$insert into public.user_question_attempts
      (user_id, question_id, question_version_id, selected_option_ids, is_correct)
    values ('11111111-1111-1111-1111-111111111111',
            'cccccccc-0000-0000-0000-000000000001',
            'dddddddd-0000-0000-0000-000000000001', array['a'], true)$$,
  'a learner cannot record an attempt against another learner’s account');

select pg_temp.expect_failure(
  $$insert into public.xp_events (user_id, kind, amount)
    values ('22222222-2222-2222-2222-222222222222', 'correct_answer', 999999)$$,
  'a learner cannot forge XP');

-- As an administrator: the question bank opens up.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select pg_temp.expect(
  (select count(*) from public.questions) = 2,
  'an administrator can read the whole question bank, drafts included');

reset role;

\echo ''
\echo 'All schema guarantees hold.'

rollback;
