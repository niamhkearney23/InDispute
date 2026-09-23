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
  raise exception 'FAIL  %: the statement was allowed when it should have been blocked', label;
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
  ('33333333-3333-3333-3333-333333333333', 'admin@example.test', '{}'),
  ('44444444-4444-4444-4444-444444444444', 'coach@example.test', '{}');

select pg_temp.expect(
  (select count(*) from public.profiles
   where id in ('11111111-1111-1111-1111-111111111111',
                '22222222-2222-2222-2222-222222222222',
                '33333333-3333-3333-3333-333333333333',
                '44444444-4444-4444-4444-444444444444')) = 4,
  'a profile is created for every new auth user');

select pg_temp.expect(
  (select count(*) from public.user_streaks) = 4,
  'a streak row is created for every new auth user');

update public.profiles set is_admin = true
where id = '33333333-3333-3333-3333-333333333333';

update public.profiles set is_coach = true
where id = '44444444-4444-4444-4444-444444444444';

select pg_temp.expect(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'is_coach'),
  'profiles carries a coach flag distinct from the administrator flag');

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

insert into public.daily_facts (slug, title, body, jurisdiction, status)
values
  ('published-fact', 'A published fact.',
   'This one is visible to learners because it has been published, and it is long enough to be a real body.',
   'VIC', 'published'),
  ('draft-fact', 'A draft fact.',
   'This one must stay invisible to learners because it is still a draft, and it is long enough to be a real body.',
   'NSW', 'draft');

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

-- The same door, the other handle. A coach signs content off and records
-- decisions about people, so an account that could hand itself that flag could
-- verify the whole bank and clear anybody to start work. Guarded by the same
-- trigger as is_admin, and tested separately because widening a guard to cover
-- a second column is exactly the kind of edit that silently covers one.
select pg_temp.expect_failure(
  $$update public.profiles set is_coach = true
    where id = '11111111-1111-1111-1111-111111111111'$$,
  'a learner cannot make themselves a coach');

select pg_temp.expect(
  (select count(*) from public.questions) = 0,
  'a learner cannot read the questions table directly');

select pg_temp.expect(
  (select count(*) from public.question_versions) = 0,
  'a learner cannot read question versions directly; that is where the answers live');

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

-- -----------------------------------------------------------------------------
-- Row Level Security, as a coach
-- -----------------------------------------------------------------------------
-- A coach signs content off and records decisions about people, and does all of
-- it through server code using the service role. RLS was deliberately NOT
-- widened for them, so from the browser they are an ordinary learner. If that
-- ever stops being true it should be a decision somebody made, not something
-- that happened.
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select pg_temp.expect(
  (select count(*) from public.question_versions) = 0,
  'a coach cannot read question versions from the browser; the answers live there');

select pg_temp.expect(
  (select count(*) from public.profiles) = 1,
  'a coach cannot read other people’s profiles from the browser');

select pg_temp.expect_failure(
  $$update public.profiles set is_admin = true
    where id = '44444444-4444-4444-4444-444444444444'$$,
  'a coach cannot promote themselves to administrator');

-- Not expect_failure, on purpose. The row above raises an exception because
-- id = auth.uid() satisfies the profiles UPDATE policy's USING clause, so the
-- statement reaches guard_profile_privileges and the trigger raises. Somebody
-- else's row fails the USING clause first: RLS filters it out of the update's
-- target set before the trigger is ever reached, so the statement runs to
-- completion having touched nothing. "Blocked with an error" and "silently
-- matched zero rows" are both a coach not being able to do this, but they are
-- different mechanisms, and asserting the wrong one here would report this as
-- broken forever while actually proving nothing about the real one.
update public.profiles set is_coach = true
  where id = '11111111-1111-1111-1111-111111111111';

-- Checked as the table owner, not as the coach: RLS already hides that row
-- from the coach's own SELECT, which would make this pass whether or not the
-- update actually failed. The point is not "the coach cannot see it changed",
-- it is "the coach did not change it".
reset role;

select pg_temp.expect(
  (select is_coach from public.profiles
   where id = '11111111-1111-1111-1111-111111111111') is distinct from true,
  'a coach cannot make somebody else a coach');

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select pg_temp.expect_failure(
  $$insert into public.xp_events (user_id, kind, amount)
    values ('22222222-2222-2222-2222-222222222222', 'correct_answer', 999999)$$,
  'a learner cannot forge XP');

select pg_temp.expect_failure(
  $$insert into public.daily_facts (slug, title, body, jurisdiction, status)
    values ('smuggled', 'A fact a learner wrote themselves',
            'This should never be insertable by anyone other than an administrator.',
            'VIC', 'published')$$,
  'a learner cannot write to the daily brief');

select pg_temp.expect(
  (select count(*) from public.daily_facts) = 1,
  'a learner sees published facts only, not drafts');

-- As an administrator: the question bank and the full fact pool open up.
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select pg_temp.expect(
  (select count(*) from public.questions) = 2,
  'an administrator can read the whole question bank, drafts included');

select pg_temp.expect(
  (select count(*) from public.daily_facts) = 2,
  'an administrator can read draft facts too');

reset role;

-- -----------------------------------------------------------------------------
-- Review workflow: flagging withdraws content from learners
-- -----------------------------------------------------------------------------
-- The point of a flag is that a reviewer has found something wrong. That must
-- take the item out of circulation immediately, without relying on the UI to
-- remember -- so it is enforced by trigger, and asserted here.

select pg_temp.expect(
  (select status from public.questions
   where id = 'cccccccc-0000-0000-0000-000000000001') = 'published',
  'the test question starts out published');

update public.question_versions
set review_flagged = true, review_note = 'Rule number is wrong'
where id = 'dddddddd-0000-0000-0000-000000000001';

select pg_temp.expect(
  (select status from public.questions
   where id = 'cccccccc-0000-0000-0000-000000000001') = 'requires_review',
  'flagging a question version withdraws the question from learners');

select pg_temp.expect(
  (select count(*) from public.v_question_delivery) = 0,
  'a flagged question no longer appears in the delivery view');

update public.daily_facts set review_flagged = true, review_note = 'Date is wrong'
where slug = 'published-fact';

select pg_temp.expect(
  (select status from public.daily_facts where slug = 'published-fact') = 'requires_review',
  'flagging a fact withdraws it from the daily brief');

select pg_temp.expect(
  (select review_note from public.daily_facts where slug = 'published-fact') = 'Date is wrong',
  'the reviewer''s note is recorded against the item, not lost in a side document');


-- -----------------------------------------------------------------------------
-- Country
-- -----------------------------------------------------------------------------
-- Australian and Malaysian civil procedure are different bodies of law, so a
-- question from the wrong country is not merely less useful, it is wrong. The
-- boundary has to be visible to the query that builds a session, which means
-- the delivery view has to carry country without joining back to a table
-- learners cannot read.

reset role;

select pg_temp.expect(
  exists (select 1 from information_schema.columns
          where table_name = 'v_question_delivery' and column_name = 'country'),
  'the delivery view carries country, so a session can be filtered without a join');

select pg_temp.expect(
  (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'jurisdiction' and e.enumlabel like 'MY%') = 4,
  'the Malaysian jurisdictions exist');

select pg_temp.expect(
  (select country from public.questions where slug = 'test-question') = 'AU',
  'a question with no country stated is Australian, which is what every existing row is');

insert into public.questions (id, slug, domain_id, status, country)
values ('cccccccc-0000-0000-0000-000000000009', 'my-question',
        'aaaaaaaa-0000-0000-0000-000000000001', 'published', 'MY');

insert into public.question_versions
  (question_id, version, question_type, stem, options, correct_option_ids,
   explanation, difficulty, jurisdiction)
values ('cccccccc-0000-0000-0000-000000000009', 1, 'multiple_choice',
        'Which court is the apex court of Malaysia?',
        '[{"id":"a","text":"Federal Court"},{"id":"b","text":"Court of Appeal"}]'::jsonb,
        array['a'], 'The Federal Court.', 1, 'MY_FEDERAL');

select pg_temp.expect(
  (select country from public.v_question_delivery
   where question_id = 'cccccccc-0000-0000-0000-000000000009') = 'MY',
  'a Malaysian question reaches the delivery view tagged MY');

select pg_temp.expect(
  (select count(*) from public.v_question_delivery where country = 'AU') = 0,
  'the Australian test question is still withdrawn, so country is not masking the flag');


-- -----------------------------------------------------------------------------
-- Country chosen at signup
-- -----------------------------------------------------------------------------
-- The country arrives in the auth user's metadata, written by the browser at
-- signup. It is therefore whatever the browser felt like sending, and the
-- trigger has to narrow it rather than trust it.

reset role;

insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000001', 'my@test',
        '{"country":"MY","display_name":"Aisha"}'::jsonb);

select pg_temp.expect(
  (select country from public.profiles where id = 'aaaa1111-0000-0000-0000-000000000001') = 'MY',
  'a signup that says MY becomes a Malaysian profile');

insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000002', 'none@test', '{"display_name":"Sam"}'::jsonb);

select pg_temp.expect(
  (select country from public.profiles where id = 'aaaa1111-0000-0000-0000-000000000002') = 'AU',
  'a signup that says nothing becomes Australian');

insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000003', 'junk@test', '{"country":"'' or 1=1 --"}'::jsonb),
       ('aaaa1111-0000-0000-0000-000000000004', 'sg@test', '{"country":"SG"}'::jsonb),
       ('aaaa1111-0000-0000-0000-000000000005', 'lower@test', '{"country":"my"}'::jsonb);

select pg_temp.expect(
  (select count(*) from public.profiles
   where id in ('aaaa1111-0000-0000-0000-000000000003',
                'aaaa1111-0000-0000-0000-000000000004',
                'aaaa1111-0000-0000-0000-000000000005')
     and country = 'AU') = 3,
  'anything that is not exactly MY is narrowed to Australian rather than trusted');

-- -----------------------------------------------------------------------------
-- The litigation trainee programme
-- -----------------------------------------------------------------------------
-- A third choice at signup. Chosen the same untrusted way as country, narrowed
-- the same way, and a trainee is Malaysian whatever the browser said.

insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000006', 'trainee@test',
        '{"country":"AU","track":"litigation_trainee"}'::jsonb);

select pg_temp.expect(
  (select track = 'litigation_trainee' and country = 'MY'
   from public.profiles where id = 'aaaa1111-0000-0000-0000-000000000006'),
  'a signup as a litigation trainee is Malaysian even when the browser says otherwise');

insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000007', 'junktrack@test',
        '{"country":"MY","track":"admin"}'::jsonb);

select pg_temp.expect(
  (select track from public.profiles where id = 'aaaa1111-0000-0000-0000-000000000007') = 'general',
  'anything that is not exactly the trainee track is general rather than trusted');

select pg_temp.expect(
  (select track from public.profiles where id = 'aaaa1111-0000-0000-0000-000000000002') = 'general',
  'a signup that says nothing about a track is general');

select pg_temp.expect_failure(
  $$update public.profiles set track = 'litigation_trainee'
    where id = 'aaaa1111-0000-0000-0000-000000000002'$$,
  'an Australian profile cannot be put on the trainee programme');

select pg_temp.expect_failure(
  $$update public.profiles set country = 'AU'
    where id = 'aaaa1111-0000-0000-0000-000000000006'$$,
  'a trainee cannot be moved to Australia while still on the programme');

-- -----------------------------------------------------------------------------
-- Firm modules: the compliance record
-- -----------------------------------------------------------------------------
-- This is the part a firm pays for, so these are the promises that have to
-- hold in the database rather than in a page that could be changed later.

insert into public.firm_modules (id, slug, name, kind, published)
values ('bbbb2222-0000-0000-0000-000000000001', 'ai-policy', 'Our AI policy', 'policy', true);

select pg_temp.expect(
  (select country is null from public.firm_modules
   where id = 'bbbb2222-0000-0000-0000-000000000001'),
  'a firm module reaches every learner by default, whatever country their account says');

insert into public.firm_module_versions (id, firm_module_id, version, body)
values ('bbbb2222-0000-0000-0000-000000000011',
        'bbbb2222-0000-0000-0000-000000000001', 1, 'Do not put client material into a public tool.');

select pg_temp.expect_failure(
  $$insert into public.firm_module_versions (firm_module_id, version, body)
    values ('bbbb2222-0000-0000-0000-000000000001', 2, 'A second current version.')$$,
  'a module cannot have two current versions at once');

-- The acknowledgement names a date, so the date must not be the client's to
-- choose. This one is worth more than the rest put together: it is the whole
-- evidentiary value of the record.
insert into public.firm_module_acknowledgements (user_id, firm_module_version_id, acknowledged_at)
values ('aaaa1111-0000-0000-0000-000000000001',
        'bbbb2222-0000-0000-0000-000000000011', timestamptz '2019-01-01 00:00:00+00');

select pg_temp.expect(
  (select acknowledged_at > now() - interval '1 minute'
   from public.firm_module_acknowledgements
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'),
  'an acknowledgement is stamped by the database, not by whoever sent the request');

select pg_temp.expect_failure(
  $$insert into public.firm_module_acknowledgements (user_id, firm_module_version_id)
    values ('aaaa1111-0000-0000-0000-000000000001',
            'bbbb2222-0000-0000-0000-000000000011')$$,
  'the same person cannot acknowledge the same version twice');

select pg_temp.expect_failure(
  $$delete from public.firm_module_versions
    where id = 'bbbb2222-0000-0000-0000-000000000011'$$,
  'a policy version somebody has acknowledged cannot be deleted');

select pg_temp.expect_failure(
  $$delete from public.firm_modules where id = 'bbbb2222-0000-0000-0000-000000000001'$$,
  'and neither can the module it belongs to, so unpublishing is the only way out');

select pg_temp.expect(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'firm_module_acknowledgements'
      and cmd in ('UPDATE', 'DELETE', 'ALL')),
  'no policy grants update or delete on an acknowledgement, to anyone including an administrator');

-- The catalog check above says no policy exists. This one says what that means
-- in practice, and it has to be written as a survival check rather than an
-- expected error: with no policy to permit it, a delete matches no rows and
-- reports success. Silently doing nothing is the correct outcome here and the
-- easiest kind of protection to believe you have when you do not.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000001';

delete from public.firm_module_acknowledgements
where user_id = 'aaaa1111-0000-0000-0000-000000000001';

update public.firm_module_acknowledgements
set acknowledged_at = timestamptz '2019-01-01 00:00:00+00'
where user_id = 'aaaa1111-0000-0000-0000-000000000001';

reset role;

select pg_temp.expect(
  (select count(*) from public.firm_module_acknowledgements
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'
     and acknowledged_at > now() - interval '1 minute') = 1,
  'a learner cannot withdraw or backdate their own acknowledgement');


-- -----------------------------------------------------------------------------
-- Before you begin: the pre-start checklist and its oversight
-- -----------------------------------------------------------------------------
-- The promise being defended: when somebody is recorded as cleared to begin,
-- the record says who decided, when, and what was still outstanding, and none
-- of those three can be changed afterwards by anybody.

insert into public.firm_steps (id, slug, title, kind, needs_firm_check, published)
values ('cccc3333-0000-0000-0000-000000000001', 'nda', 'Sign the NDA', 'sign', true, true);

select pg_temp.expect(
  (select country is null and required from public.firm_steps
   where id = 'cccc3333-0000-0000-0000-000000000001'),
  'a checklist item reaches everyone and is required unless the firm says otherwise');

select pg_temp.expect_failure(
  $$insert into public.firm_steps (slug, title, kind, firm_module_id)
    values ('bad-read', 'Read something', 'read', null)$$,
  'a reading step must point at one of the firm''s documents');

select pg_temp.expect_failure(
  $$insert into public.firm_steps (slug, title, kind, firm_module_id, needs_firm_check)
    values ('bad-check', 'Read something', 'read',
            'bbbb2222-0000-0000-0000-000000000001', true)$$,
  'nobody at the firm confirms that somebody else read something');

select pg_temp.expect_failure(
  $$insert into public.firm_steps (slug, title, kind, firm_module_id)
    values ('bad-link', 'Sign something', 'sign',
            'bbbb2222-0000-0000-0000-000000000001')$$,
  'only a reading step points at a document');

-- The declaration and the confirmation are two different facts about the same
-- item, and both dates have to be the database's.
insert into public.firm_step_declarations (user_id, firm_step_id, declared_at)
values ('aaaa1111-0000-0000-0000-000000000001',
        'cccc3333-0000-0000-0000-000000000001', timestamptz '2019-01-01 00:00:00+00');

select pg_temp.expect(
  (select declared_at > now() - interval '1 minute'
   from public.firm_step_declarations
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'),
  'a declaration is stamped by the database, not by whoever sent the request');

insert into public.firm_step_confirmations (user_id, firm_step_id, confirmed_by, confirmed_at)
values ('aaaa1111-0000-0000-0000-000000000001',
        'cccc3333-0000-0000-0000-000000000001',
        '33333333-3333-3333-3333-333333333333', timestamptz '2019-01-01 00:00:00+00');

select pg_temp.expect(
  (select confirmed_at > now() - interval '1 minute'
   from public.firm_step_confirmations
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'),
  'and so is a confirmation');

select pg_temp.expect_failure(
  $$delete from public.firm_steps where id = 'cccc3333-0000-0000-0000-000000000001'$$,
  'an item somebody has acted on cannot be deleted out from under the record');

select pg_temp.expect_failure(
  $$insert into public.firm_step_confirmations (user_id, firm_step_id, confirmed_by)
    values ('aaaa1111-0000-0000-0000-000000000001',
            'cccc3333-0000-0000-0000-000000000001',
            '33333333-3333-3333-3333-333333333333')$$,
  'the same item cannot be confirmed twice for the same person');

-- The decision itself.
insert into public.onboarding_decisions (user_id, decision, decided_by, outstanding_count, decided_at)
values ('aaaa1111-0000-0000-0000-000000000001', 'cleared',
        '33333333-3333-3333-3333-333333333333', 2, timestamptz '2019-01-01 00:00:00+00');

select pg_temp.expect(
  (select decided_at > now() - interval '1 minute'
   from public.onboarding_decisions
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'),
  'a clearance is dated by the database');

select pg_temp.expect_failure(
  $$insert into public.onboarding_decisions (user_id, decision, decided_by, outstanding_count)
    values ('aaaa1111-0000-0000-0000-000000000001', 'cleared',
            '33333333-3333-3333-3333-333333333333', -1)$$,
  'a negative number of outstanding items is not a thing that can be recorded');

insert into public.onboarding_decisions (user_id, decision, decided_by, outstanding_count)
values ('aaaa1111-0000-0000-0000-000000000001', 'withdrawn',
        '33333333-3333-3333-3333-333333333333', 2);

select pg_temp.expect(
  (select count(*) from public.onboarding_decisions
   where user_id = 'aaaa1111-0000-0000-0000-000000000001') = 2,
  'withdrawing a clearance adds a decision rather than removing the one it undoes');

select pg_temp.expect_failure(
  $$delete from auth.users where id = '33333333-3333-3333-3333-333333333333'$$,
  'the person who cleared somebody cannot be deleted out of the record');

select pg_temp.expect(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('firm_step_declarations', 'firm_step_confirmations',
                        'onboarding_decisions')
      and cmd in ('UPDATE', 'DELETE', 'ALL')),
  'no policy grants update or delete on any of the three records, administrators included');

-- As with acknowledgements: no policy means a write matches no rows and reports
-- success, so this has to be written as a survival check rather than an
-- expected error.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

delete from public.onboarding_decisions
where user_id = 'aaaa1111-0000-0000-0000-000000000001';

update public.onboarding_decisions set outstanding_count = 0
where user_id = 'aaaa1111-0000-0000-0000-000000000001';

delete from public.firm_step_declarations
where user_id = 'aaaa1111-0000-0000-0000-000000000001';

reset role;

select pg_temp.expect(
  (select count(*) from public.onboarding_decisions
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'
     and outstanding_count = 2) = 2,
  'an administrator cannot delete a decision or edit how much was outstanding when it was made');

select pg_temp.expect(
  (select count(*) from public.firm_step_declarations
   where user_id = 'aaaa1111-0000-0000-0000-000000000001') = 1,
  'nor remove what somebody told the firm they had done');

-- A start date is the firm's fact about a person, not a setting they can move.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000001';

select pg_temp.expect_failure(
  $$update public.profiles set starts_on = current_date + 60
    where id = 'aaaa1111-0000-0000-0000-000000000001'$$,
  'a joiner cannot move their own start date, which would move their own deadline');

-- Its last day is the same fact, held by the same person.
select pg_temp.expect_failure(
  $$update public.profiles set ends_on = current_date + 90
    where id = 'aaaa1111-0000-0000-0000-000000000001'$$,
  'a joiner cannot move their own end date either');

reset role;


-- -----------------------------------------------------------------------------
-- Daily homework
-- -----------------------------------------------------------------------------
-- The promise: a person ticks off their own homework, nobody ticks it for
-- them, and nobody, administrators included, can quietly change or remove
-- what they said afterwards.

insert into public.homework_declarations (user_id, day, task_slug)
values ('aaaa1111-0000-0000-0000-000000000001', 1, 'find-your-way');

select pg_temp.expect(
  (select declared_at > now() - interval '1 minute'
   from public.homework_declarations
   where user_id = 'aaaa1111-0000-0000-0000-000000000001' and day = 1),
  'homework is dated by the database, not by whoever sent the request');

select pg_temp.expect_failure(
  $$insert into public.homework_declarations (user_id, day, task_slug)
    values ('aaaa1111-0000-0000-0000-000000000001', 0, 'find-your-way')$$,
  'there is no day zero of a placement');

select pg_temp.expect_failure(
  $$insert into public.homework_declarations (user_id, day, task_slug)
    values ('aaaa1111-0000-0000-0000-000000000001', 21, 'find-your-way')$$,
  'a day past the end of the four weeks is not a day that can be ticked off');

select pg_temp.expect_failure(
  $$insert into public.homework_declarations (user_id, day, task_slug)
    values ('aaaa1111-0000-0000-0000-000000000001', 1, 'find-your-way')$$,
  'the same day cannot be ticked off twice');

select pg_temp.expect(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'homework_declarations'
      and cmd in ('UPDATE', 'DELETE', 'ALL')),
  'no policy grants update or delete on a homework record, administrators included');

-- Somebody else's homework, as somebody else.
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select pg_temp.expect_failure(
  $$insert into public.homework_declarations (user_id, day, task_slug)
    values ('aaaa1111-0000-0000-0000-000000000001', 2, 'the-file-anatomy')$$,
  'nobody can tick off somebody else''s homework');

select pg_temp.expect(
  (select count(*) from public.homework_declarations) = 0,
  'and nobody can read it either');

-- Their own, as themselves.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000001';

insert into public.homework_declarations (user_id, day, task_slug)
values ('aaaa1111-0000-0000-0000-000000000001', 2, 'the-file-anatomy');

select pg_temp.expect(
  (select count(*) from public.homework_declarations) = 2,
  'a person can tick off their own homework');

-- No policy means a write matches no rows and reports success, so this is a
-- survival check rather than an expected error, as with the decisions above.
delete from public.homework_declarations where day = 1;
update public.homework_declarations set day = 20 where day = 2;

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
delete from public.homework_declarations
where user_id = 'aaaa1111-0000-0000-0000-000000000001';
update public.homework_declarations set task_slug = 'handover'
where user_id = 'aaaa1111-0000-0000-0000-000000000001';

reset role;

select pg_temp.expect(
  (select count(*) from public.homework_declarations
   where user_id = 'aaaa1111-0000-0000-0000-000000000001'
     and day in (1, 2) and task_slug in ('find-your-way', 'the-file-anatomy')) = 2,
  'neither the person nor an administrator can take back or rewrite what was said');


-- -----------------------------------------------------------------------------
-- The work board
-- -----------------------------------------------------------------------------
-- A coach posts work, the people it is for see it and nobody else does, one
-- name wins on a post that is for one person, what is handed in cannot be
-- taken back or rewritten by anybody, and marking is the only thing a coach
-- can change on it. The coach fixture (44444444...) posts; the Malaysian
-- trainee (aaaa1111-...-0006), the Malaysian general learner (...-0001) and
-- the Australian learner (11111111...) are the three audiences.

reset role;

-- A second trainee, to test that the first name wins.
insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000008', 'trainee2@test',
        '{"track":"litigation_trainee"}'::jsonb);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

insert into public.work_posts (id, kind, title, max_claims, trainees_only, country, published, posted_by)
values
  ('bbbb0001-0000-0000-0000-000000000001', 'task', 'Draft the chronology', 1, true, 'MY', true,
   '44444444-4444-4444-4444-444444444444'),
  ('bbbb0001-0000-0000-0000-000000000002', 'task', 'Read the engagement letter', null, false, 'MY', true,
   '44444444-4444-4444-4444-444444444444'),
  ('bbbb0001-0000-0000-0000-000000000003', 'material', 'Sample affidavit', 1, false, 'MY', true,
   '44444444-4444-4444-4444-444444444444'),
  ('bbbb0001-0000-0000-0000-000000000004', 'task', 'Not yet published', 1, true, 'MY', false,
   '44444444-4444-4444-4444-444444444444');

select pg_temp.expect(
  (select count(*) from public.work_posts) = 4,
  'a coach can post work, and sees drafts');

select pg_temp.expect(
  (select published_at is not null from public.work_posts
   where id = 'bbbb0001-0000-0000-0000-000000000001'),
  'publishing a post stamps when, from the database clock');

select pg_temp.expect_failure(
  $$insert into public.work_posts (title, link_url, posted_by)
    values ('Elsewhere', 'https://dropbox.com/s/abc', '44444444-4444-4444-4444-444444444444')$$,
  'a post cannot link anywhere but the hosts we chose');

-- The Malaysian trainee: sees the trainees-only post, the widened one and the material.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000006';

select pg_temp.expect(
  (select count(*) from public.work_posts) = 3,
  'a trainee sees every published post for them, and no draft');

-- The Malaysian general learner: the trainees-only post is not for them.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000001';

select pg_temp.expect(
  (select count(*) from public.work_posts) = 2
  and not exists (select 1 from public.work_posts where id = 'bbbb0001-0000-0000-0000-000000000001'),
  'a general learner sees only the posts a coach widened to everyone');

select pg_temp.expect_failure(
  $$insert into public.work_claims (post_id, user_id)
    values ('bbbb0001-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000001')$$,
  'nobody can put their name on a post they cannot see');

-- The Australian learner: nothing here is for them.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select pg_temp.expect(
  (select count(*) from public.work_posts) = 0,
  'a post for one country is invisible in the other');

-- The first trainee claims the one-person post and the everyone post.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000006';

insert into public.work_claims (post_id, user_id)
values ('bbbb0001-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000006'),
       ('bbbb0001-0000-0000-0000-000000000002', 'aaaa1111-0000-0000-0000-000000000006');

select pg_temp.expect(
  (select count(*) from public.work_claims
   where user_id = 'aaaa1111-0000-0000-0000-000000000006') = 2,
  'a trainee can put their name on work that is for them');

select pg_temp.expect_failure(
  $$insert into public.work_claims (post_id, user_id)
    values ('bbbb0001-0000-0000-0000-000000000003', 'aaaa1111-0000-0000-0000-000000000006')$$,
  'a material is for reading, not for claiming');

select pg_temp.expect_failure(
  $$insert into public.work_claims (post_id, user_id)
    values ('bbbb0001-0000-0000-0000-000000000002', 'aaaa1111-0000-0000-0000-000000000008')$$,
  'nobody can put somebody else''s name on a piece of work');

-- The second trainee: the one-person post is taken, the everyone post is not.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000008';

select pg_temp.expect_failure(
  $$insert into public.work_claims (post_id, user_id)
    values ('bbbb0001-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000008')$$,
  'on a post for one person, the first name wins');

insert into public.work_claims (post_id, user_id)
values ('bbbb0001-0000-0000-0000-000000000002', 'aaaa1111-0000-0000-0000-000000000008');

select pg_temp.expect(
  (select count(*) from public.work_claims
   where post_id = 'bbbb0001-0000-0000-0000-000000000002') = 1,
  'on a post for everyone each person sees their own name and nobody else''s');

select pg_temp.expect(
  (select claims from public.work_claim_counts
   where post_id = 'bbbb0001-0000-0000-0000-000000000001') = 1
  and (select count(*) from public.work_claims
       where post_id = 'bbbb0001-0000-0000-0000-000000000001') = 0,
  'an intern can see how many names a post has without seeing whose');

select pg_temp.expect_failure(
  $$insert into public.work_submissions (post_id, user_id, file_path, declared_clean)
    values ('bbbb0001-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000008',
            'submissions/aaaa1111-0000-0000-0000-000000000008/x/1.pdf', true)$$,
  'work cannot be handed in on something without your name on it');

-- The first trainee hands work in.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000006';

select pg_temp.expect_failure(
  $$insert into public.work_submissions (post_id, user_id, file_path, declared_clean)
    values ('bbbb0001-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000006',
            'submissions/aaaa1111-0000-0000-0000-000000000006/x/1.pdf', false)$$,
  'work that is not declared free of client-identifying information cannot be handed in');

insert into public.work_submissions (id, post_id, user_id, file_path, declared_clean, submitted_at)
values ('bbbb0002-0000-0000-0000-000000000001', 'bbbb0001-0000-0000-0000-000000000001',
        'aaaa1111-0000-0000-0000-000000000006',
        'submissions/aaaa1111-0000-0000-0000-000000000006/x/1.pdf', true,
        timestamptz '2019-01-01 00:00:00+00');

select pg_temp.expect(
  (select submitted_at > now() - interval '1 minute' from public.work_submissions
   where id = 'bbbb0002-0000-0000-0000-000000000001'),
  'a submission is dated by the database, not by whoever sent the request');

-- No update or delete policy for the intern means zero rows changed, not an
-- error, so these are survival checks.
update public.work_submissions set note = 'rewritten'
where id = 'bbbb0002-0000-0000-0000-000000000001';
delete from public.work_submissions where id = 'bbbb0002-0000-0000-0000-000000000001';
delete from public.work_claims where user_id = 'aaaa1111-0000-0000-0000-000000000006';

select pg_temp.expect(
  (select count(*) from public.work_submissions
   where id = 'bbbb0002-0000-0000-0000-000000000001' and note = '') = 1
  and (select count(*) from public.work_claims
       where user_id = 'aaaa1111-0000-0000-0000-000000000006') = 2,
  'an intern cannot rewrite, take back or un-claim what they handed in');

-- The other trainee cannot see it.
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000008';

select pg_temp.expect(
  (select count(*) from public.work_submissions) = 0,
  'a trainee never sees another trainee''s work');

-- The coach marks it.
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

update public.work_submissions
set verdict = 'good', feedback = 'Clear and complete.', marked_by = '44444444-4444-4444-4444-444444444444'
where id = 'bbbb0002-0000-0000-0000-000000000001';

select pg_temp.expect(
  (select verdict = 'good' and marked_at is not null from public.work_submissions
   where id = 'bbbb0002-0000-0000-0000-000000000001'),
  'a coach can mark a submission, and the mark is dated by the database');

select pg_temp.expect_failure(
  $$update public.work_submissions set file_path = 'submissions/elsewhere.pdf'
    where id = 'bbbb0002-0000-0000-0000-000000000001'$$,
  'marking cannot change what was handed in');

-- Unpublishing stops new claims without hiding the post from its claimant.
update public.work_posts set published = false
where id = 'bbbb0001-0000-0000-0000-000000000001';

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000006';

select pg_temp.expect(
  (select count(*) from public.work_posts
   where id = 'bbbb0001-0000-0000-0000-000000000001') = 1,
  'somebody who put their name on a post keeps seeing it after it is unpublished');

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000008';

select pg_temp.expect(
  (select count(*) from public.work_posts
   where id = 'bbbb0001-0000-0000-0000-000000000001') = 0,
  'and somebody who did not, does not');

-- The bucket. An intern writes under their own folder of submissions and
-- nowhere else; a coach writes under posts; only a coach reads directly.
insert into storage.objects (bucket_id, name, owner)
values ('work', 'submissions/aaaa1111-0000-0000-0000-000000000008/p/1.pdf', auth.uid());

select pg_temp.expect_failure(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('work', 'submissions/aaaa1111-0000-0000-0000-000000000006/p/1.pdf', auth.uid())$$,
  'an intern cannot upload into another intern''s folder');

select pg_temp.expect_failure(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('work', 'posts/bbbb0001-0000-0000-0000-000000000001/a.pdf', auth.uid())$$,
  'an intern cannot upload where a coach''s files live');

select pg_temp.expect(
  (select count(*) from storage.objects where bucket_id = 'work') = 0,
  'an intern cannot read the work bucket directly, their own file included');

set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

insert into storage.objects (bucket_id, name, owner)
values ('work', 'posts/bbbb0001-0000-0000-0000-000000000001/a.pdf', auth.uid());

select pg_temp.expect(
  (select count(*) from storage.objects where bucket_id = 'work') = 2,
  'a coach can upload a post''s file and can read everything in the bucket');

reset role;

select pg_temp.expect_failure(
  $$delete from public.work_posts where id = 'bbbb0001-0000-0000-0000-000000000001'$$,
  'a post with a name on it cannot be deleted, by anybody');

select pg_temp.expect(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'work_claims'
      and cmd in ('UPDATE', 'DELETE', 'ALL')),
  'no policy grants update or delete on a claim, administrators included');

select pg_temp.expect(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'work_submissions'
      and cmd in ('DELETE', 'ALL')),
  'no policy grants delete on a submission, administrators included');


-- =============================================================================
-- The work board, second pass: how many may take it, and the message thread
-- =============================================================================
-- Three interns this time. A post that two people may take: the first two
-- names go on, the third is refused, and the refusal comes from the row
-- lock in the trigger rather than from anything the app remembered.
insert into auth.users (id, email, raw_user_meta_data)
values ('aaaa1111-0000-0000-0000-000000000009', 'trainee3@test',
        '{"track":"litigation_trainee"}'::jsonb);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

insert into public.work_posts (id, kind, title, max_claims, trainees_only, country, published, posted_by,
                               expected_minutes)
values ('bbbb0001-0000-0000-0000-000000000005', 'task', 'Two of you', 2, true, 'MY', true,
        '44444444-4444-4444-4444-444444444444', 90);

select pg_temp.expect_failure(
  $$update public.work_posts set expected_minutes = 0
    where id = 'bbbb0001-0000-0000-0000-000000000005'$$,
  'an estimate of no time at all is not an estimate');

select pg_temp.expect_failure(
  $$update public.work_posts set max_claims = 0
    where id = 'bbbb0001-0000-0000-0000-000000000005'$$,
  'a task nobody may take is not a task');

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000006';
insert into public.work_claims (post_id, user_id)
values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000006');

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000008';
insert into public.work_claims (post_id, user_id)
values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000008');

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000009';
select pg_temp.expect_failure(
  $$insert into public.work_claims (post_id, user_id)
    values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000009')$$,
  'on a post for two people, the third name is refused');

select pg_temp.expect(
  (select claims from public.work_claim_counts
   where post_id = 'bbbb0001-0000-0000-0000-000000000005') = 2,
  'the third person can see the post is full');

-- The message thread. The third intern, with no name on the post, may still
-- ask about it: the thread is for finding out whether to take something as
-- much as for doing it.
-- Sent with a date from years ago, which the database must overwrite.
insert into public.work_messages (post_id, thread_user_id, sender_id, body, sent_at)
values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000009',
        'aaaa1111-0000-0000-0000-000000000009', 'Is there a third place?', '2001-01-01');

select pg_temp.expect(
  (select sent_at > now() - interval '1 minute' from public.work_messages
   where body = 'Is there a third place?'),
  'a message is dated by the database, not by whoever sent the request');

select pg_temp.expect_failure(
  $$insert into public.work_messages (post_id, thread_user_id, sender_id, body)
    values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000006',
            'aaaa1111-0000-0000-0000-000000000009', 'Hello')$$,
  'an intern cannot write into another intern''s thread');

select pg_temp.expect_failure(
  $$insert into public.work_messages (post_id, thread_user_id, sender_id, body)
    values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000009',
            'aaaa1111-0000-0000-0000-000000000006', 'Hello')$$,
  'an intern cannot send a message under somebody else''s name');

select pg_temp.expect_failure(
  $$insert into public.work_messages (post_id, thread_user_id, sender_id, body)
    values ('bbbb0001-0000-0000-0000-000000000004', 'aaaa1111-0000-0000-0000-000000000009',
            'aaaa1111-0000-0000-0000-000000000009', 'Hello')$$,
  'an intern cannot message about a post they cannot see');

select pg_temp.expect_failure(
  $$insert into public.work_messages (post_id, thread_user_id, sender_id, body)
    values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000009',
            'aaaa1111-0000-0000-0000-000000000009', '')$$,
  'an empty message is not a message');

-- No update or delete policy, so these are zero rows changed rather than an
-- error: the check is that the message survives.
update public.work_messages set body = 'Changed' where body = 'Is there a third place?';
select pg_temp.expect(
  (select count(*) from public.work_messages where body = 'Is there a third place?') = 1,
  'a message, once sent, cannot be reworded');

delete from public.work_messages where body = 'Is there a third place?';
select pg_temp.expect(
  (select count(*) from public.work_messages where body = 'Is there a third place?') = 1,
  'a message, once sent, cannot be withdrawn');

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000006';
select pg_temp.expect(
  (select count(*) from public.work_messages
   where thread_user_id = 'aaaa1111-0000-0000-0000-000000000009') = 0,
  'an intern cannot read another intern''s thread');

-- The coach answers in the intern's thread, and reads every thread.
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
insert into public.work_messages (post_id, thread_user_id, sender_id, body)
values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000009',
        '44444444-4444-4444-4444-444444444444', 'No, but the chronology is still open.');

select pg_temp.expect(
  (select count(*) from public.work_messages
   where thread_user_id = 'aaaa1111-0000-0000-0000-000000000009') = 2,
  'a coach can reply in an intern''s thread and reads the whole of it');

select pg_temp.expect_failure(
  $$insert into public.work_messages (post_id, thread_user_id, sender_id, body)
    values ('bbbb0001-0000-0000-0000-000000000005', 'aaaa1111-0000-0000-0000-000000000009',
            'aaaa1111-0000-0000-0000-000000000009', 'Forged')$$,
  'a coach cannot send a message under an intern''s name');

set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000009';
select pg_temp.expect(
  (select count(*) from public.work_messages
   where thread_user_id = 'aaaa1111-0000-0000-0000-000000000009') = 2,
  'the intern reads the coach''s reply in their own thread');

select pg_temp.expect(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'work_messages'
      and cmd in ('UPDATE', 'DELETE')
  ),
  'no policy grants update or delete on a message, coaches included');

reset role;

-- -----------------------------------------------------------------------------
-- Joining: the invitation is a credential
-- -----------------------------------------------------------------------------
-- The link is the only way into this system without an existing account, so
-- these are the promises that matter most.

insert into public.joiner_invitations (token_hash, email, display_name, invited_by, starts_on)
values ('hash-of-a-token-aaaa', 'joiner@example.test', 'A Joiner',
        '33333333-3333-3333-3333-333333333333', current_date + 30);

select pg_temp.expect(
  (select expires_at > now() and expires_at < now() + interval '15 days'
   from public.joiner_invitations where email = 'joiner@example.test'),
  'an invitation expires by default rather than working forever');

-- A caller naming its own expiry is not an expiry.
insert into public.joiner_invitations (token_hash, email, invited_by, expires_at)
values ('hash-of-a-token-bbbb', 'forever@example.test',
        '33333333-3333-3333-3333-333333333333', now() + interval '40 years');

select pg_temp.expect(
  (select expires_at < now() + interval '15 days'
   from public.joiner_invitations where email = 'forever@example.test'),
  'an invitation cannot be created with an expiry of its own choosing');

select pg_temp.expect_failure(
  $$insert into public.joiner_invitations (token_hash, email, invited_by)
    values ('hash-of-a-token-cccc', 'joiner@example.test',
            '33333333-3333-3333-3333-333333333333')$$,
  'a second live invitation to the same person is refused, so calling one back closes the door');

-- Which programme the invitation is for, with the same rule as profiles.
select pg_temp.expect(
  (select track = 'general' from public.joiner_invitations where email = 'joiner@example.test'),
  'an invitation is for the general programme unless it says otherwise');

insert into public.joiner_invitations (token_hash, email, invited_by, country, track)
values ('hash-of-a-token-track', 'trainee-invite@example.test',
        '33333333-3333-3333-3333-333333333333', 'MY', 'litigation_trainee');

select pg_temp.expect_failure(
  $$insert into public.joiner_invitations (token_hash, email, invited_by, country, track)
    values ('hash-of-a-token-au-trainee', 'au-trainee@example.test',
            '33333333-3333-3333-3333-333333333333', 'AU', 'litigation_trainee')$$,
  'an invitation cannot put an Australian on the litigation trainee programme');

-- An account the administrator made starts with a password they have seen,
-- and the flag that says so is the person's own to clear once they have
-- chosen their own.
select pg_temp.expect(
  (select not must_change_password from public.profiles
   where id = 'aaaa1111-0000-0000-0000-000000000006'),
  'a person who set their own password is not asked to change it');

select pg_temp.expect(
  (select count(*) from public.joiner_invitations
   where lower(email) = 'joiner@example.test') = 1,
  'and the address is matched case-insensitively, because nobody types their own twice the same way');

-- Two separate mechanisms, and it is worth being precise about which does what.
-- On insert the trigger forces a new invitation to be pending, so a request
-- cannot create one that is already taken up or already called back.
insert into public.joiner_invitations (token_hash, email, invited_by, accepted_at, accepted_by, revoked_at)
values ('hash-of-a-token-dddd', 'both@example.test',
        '33333333-3333-3333-3333-333333333333', now(),
        '33333333-3333-3333-3333-333333333333', now());

select pg_temp.expect(
  (select accepted_at is null and accepted_by is null and revoked_at is null
   from public.joiner_invitations where email = 'both@example.test'),
  'an invitation cannot be created already taken up or already called back');

-- On update the check constraint is what bites, which is where it matters:
-- this is the state an invitation could otherwise be talked into afterwards.
select pg_temp.expect_failure(
  $$update public.joiner_invitations
    set accepted_at = now(),
        accepted_by = '33333333-3333-3333-3333-333333333333',
        revoked_at = now()
    where email = 'both@example.test'$$,
  'an invitation cannot be both taken up and called back');

select pg_temp.expect_failure(
  $$update public.joiner_invitations set accepted_at = now()
    where email = 'both@example.test'$$,
  'an invitation marked accepted must say by whom');

select pg_temp.expect(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'joiner_invitations'
      and column_name in ('is_admin', 'is_coach', 'admin', 'role', 'password')),
  'there is no column on an invitation that could grant rights or carry a password');

-- Revoking is what closes a live invitation, and it frees the address again.
update public.joiner_invitations set revoked_at = now()
where email = 'joiner@example.test';

insert into public.joiner_invitations (token_hash, email, invited_by)
values ('hash-of-a-token-eeee', 'joiner@example.test',
        '33333333-3333-3333-3333-333333333333');

select pg_temp.expect(
  (select count(*) from public.joiner_invitations
   where lower(email) = 'joiner@example.test') = 2,
  'once called back, a fresh invitation to the same person is allowed');

-- A learner must not be able to read the list of who is joining and when.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa1111-0000-0000-0000-000000000001';

select pg_temp.expect(
  (select count(*) from public.joiner_invitations) = 0,
  'a signed-in learner cannot see any invitation, not even their own');

select pg_temp.expect_failure(
  $$insert into public.joiner_invitations (token_hash, email, invited_by)
    values ('forged', 'me@example.test', 'aaaa1111-0000-0000-0000-000000000001')$$,
  'nor invite anybody');

reset role;


-- -----------------------------------------------------------------------------
-- Verification expires
-- -----------------------------------------------------------------------------
-- The stamp has to stop being true on a date, or the longer the app runs the
-- more of its content is confidently wrong.

update public.question_versions
set verification_status = 'human_verified', review_due_on = null
where is_current
  and question_id = (select id from public.questions order by slug limit 1);

select pg_temp.expect(
  (select review_due_on is not null and review_due_on > current_date
   from public.question_versions
   where is_current
     and question_id = (select id from public.questions order by slug limit 1)),
  'a sign-off with no end date is given one rather than left open-ended');

-- Losing verification must clear the date. Otherwise a flagged item reads as
-- "verified until March", which is the opposite of what happened to it.
update public.question_versions
set verification_status = 'requires_review', review_flagged = true
where is_current
  and question_id = (select id from public.questions order by slug limit 1);

select pg_temp.expect(
  (select review_due_on is null
   from public.question_versions
   where is_current
     and question_id = (select id from public.questions order by slug limit 1)),
  'an item that loses its verification does not keep the expiry date it had');

-- And a caller cannot sign something off until the next century by naming its
-- own date... it can name one, but only within the application's choices; the
-- database's job here is only to refuse the open-ended case, which it does by
-- filling it in. Confirm a supplied date is honoured, so the reviewer's choice
-- is not quietly overwritten either.
update public.question_versions
set verification_status = 'human_verified', review_due_on = current_date + 180
where is_current
  and question_id = (select id from public.questions order by slug limit 1);

select pg_temp.expect(
  (select review_due_on = current_date + 180
   from public.question_versions
   where is_current
     and question_id = (select id from public.questions order by slug limit 1)),
  'a date the reviewer chose is kept, not replaced by the default');

select pg_temp.expect(
  (select count(*) from information_schema.columns
   where table_schema = 'public'
     and table_name in ('question_versions', 'daily_facts')
     and column_name = 'review_due_on') = 2,
  'both the question versions and the daily facts carry an expiry');

-- -----------------------------------------------------------------------------
-- Avatars
-- -----------------------------------------------------------------------------
-- The one place this schema touches storage.objects rather than a table of its
-- own. Learner A and learner B are the same two fixtures used above; B's photo
-- is seeded here, as the unrestricted role, before A's session ever begins.
insert into storage.objects (bucket_id, name, owner)
values ('avatars', '22222222-2222-2222-2222-222222222222/avatar.png',
        '22222222-2222-2222-2222-222222222222');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into storage.objects (bucket_id, name, owner)
values ('avatars', '11111111-1111-1111-1111-111111111111/avatar.png', auth.uid());

select pg_temp.expect(
  (select count(*) from storage.objects
   where bucket_id = 'avatars' and name = '11111111-1111-1111-1111-111111111111/avatar.png') = 1,
  'a learner can upload to their own avatar folder');

select pg_temp.expect_failure(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('avatars', '22222222-2222-2222-2222-222222222222/avatar2.png',
            '11111111-1111-1111-1111-111111111111')$$,
  'a learner cannot upload into another learner''s avatar folder');

-- An UPDATE or DELETE the USING clause hides the target row from is not an
-- error, it is zero rows changed, so the check is that the row survives
-- untouched rather than that the statement throws.
update storage.objects set name = '22222222-2222-2222-2222-222222222222/pwned.png'
where bucket_id = 'avatars' and name = '22222222-2222-2222-2222-222222222222/avatar.png';

select pg_temp.expect(
  (select count(*) from storage.objects
   where bucket_id = 'avatars' and name = '22222222-2222-2222-2222-222222222222/avatar.png') = 1,
  'a learner cannot rewrite another learner''s avatar object');

delete from storage.objects
where bucket_id = 'avatars' and name = '22222222-2222-2222-2222-222222222222/avatar.png';

select pg_temp.expect(
  (select count(*) from storage.objects
   where bucket_id = 'avatars' and name = '22222222-2222-2222-2222-222222222222/avatar.png') = 1,
  'a learner cannot delete another learner''s avatar object');

delete from storage.objects
where bucket_id = 'avatars' and name = '11111111-1111-1111-1111-111111111111/avatar.png';

select pg_temp.expect(
  (select count(*) from storage.objects
   where bucket_id = 'avatars' and name = '11111111-1111-1111-1111-111111111111/avatar.png') = 0,
  'a learner can delete their own avatar object');

reset role;

set local role anon;

select pg_temp.expect(
  (select count(*) from storage.objects where bucket_id = 'avatars') = 1,
  'a signed-out visitor can still read from the avatars bucket');

reset role;

-- -----------------------------------------------------------------------------
-- Certification register
-- -----------------------------------------------------------------------------
-- A coach's own trainees, on their own real cases: reachable by a coach or
-- administrator only. The coach fixture above (44444444...) already has
-- is_coach set; learner-a (11111111...) is a plain learner with neither flag.
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

insert into public.certification_trainees (id, full_name, firm_name, created_by)
values ('aaaa2222-0000-0000-0000-000000000001', 'Test Trainee', 'Test Firm',
        '44444444-4444-4444-4444-444444444444');

insert into public.certification_entries (id, trainee_id, box_number, case_no, created_by)
values ('aaaa2222-0000-0000-0000-000000000002', 'aaaa2222-0000-0000-0000-000000000001',
        1, 'Case 1/2026', '44444444-4444-4444-4444-444444444444');

select pg_temp.expect(
  (select count(*) from public.certification_trainees
   where id = 'aaaa2222-0000-0000-0000-000000000001') = 1,
  'a coach can add a trainee to the certification register');

select pg_temp.expect(
  (select count(*) from public.certification_entries
   where id = 'aaaa2222-0000-0000-0000-000000000002') = 1,
  'a coach can log a certification entry against a trainee');

-- A mis-graded entry is corrected in place, unlike the append-only firm
-- records: this is a coach grading their own trainee's own work, not a
-- decision about a third party's rights.
update public.certification_entries set grade = 'l3_independent'
where id = 'aaaa2222-0000-0000-0000-000000000002';

select pg_temp.expect(
  (select grade::text from public.certification_entries
   where id = 'aaaa2222-0000-0000-0000-000000000002') = 'l3_independent',
  'a coach can correct a certification entry they logged');

select pg_temp.expect_failure(
  $$insert into public.certification_entries (trainee_id, box_number, case_no)
    values ('aaaa2222-0000-0000-0000-000000000001', 16, 'Case 2/2026')$$,
  'a box number outside 1 to 15 is rejected');

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select pg_temp.expect(
  (select count(*) from public.certification_trainees) = 0,
  'a learner cannot see any trainee on the certification register');

select pg_temp.expect_failure(
  $$insert into public.certification_trainees (full_name, firm_name)
    values ('Sneaky', 'Nobody''s Firm')$$,
  'a learner cannot add themselves to the certification register');

reset role;


\echo ''
\echo 'All schema guarantees hold.'

rollback;
