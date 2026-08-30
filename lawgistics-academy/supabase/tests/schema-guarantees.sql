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


\echo ''
\echo 'All schema guarantees hold.'

rollback;
