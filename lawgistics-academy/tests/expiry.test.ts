import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  asHoldMonths,
  daysUntilDue,
  defaultHold,
  dueDateFrom,
  isDueSoon,
  isLapsed,
} from '../src/lib/review/expiry';
import { sortReviewItems, summarise, type ReviewItem } from '../src/lib/review/service';

/**
 * Verification that runs out.
 *
 * The promise this defends is the one that makes the app worth keeping: that
 * "signed off" means signed off *now*, not signed off once in 2026. Rules of
 * court are amended and practice notes are reissued, and a stamp that never
 * expired would make the verified content the least trustworthy thing here,
 * because an item nobody has checked at least looks unchecked.
 */

const ROOT = path.join(__dirname, '..');
const MIGRATION = fs.readFileSync(
  path.join(ROOT, 'supabase/migrations/0010_verification_expires.sql'),
  'utf8',
);
const SCHEMA_ONLY = MIGRATION.replace(/--.*$/gm, '');

// -----------------------------------------------------------------------------
// When a sign-off has run out
// -----------------------------------------------------------------------------

test('only a verified item can lapse', () => {
  // "Nobody has ever checked this" and "somebody checked it and it is due
  // again" are different facts. Collapsing them would lose the distinction the
  // queue exists to show.
  assert.equal(isLapsed('requires_review', '2020-01-01', '2026-08-09'), false);
  assert.equal(isLapsed('unverified', '2020-01-01', '2026-08-09'), false);
  assert.equal(isLapsed('ai_drafted', '2020-01-01', '2026-08-09'), false);
  assert.equal(isLapsed('human_verified', '2020-01-01', '2026-08-09'), true);
});

test('a sign-off with no expiry is not treated as lapsed', () => {
  // Rows written before the expiry existed. The database backfills them; until
  // it does, they must not all appear as expired at once, which would be a
  // false alarm large enough to teach somebody to ignore the queue.
  assert.equal(isLapsed('human_verified', null, '2026-08-09'), false);
});

test('the boundary is the day itself, not the day after', () => {
  assert.equal(isLapsed('human_verified', '2026-08-10', '2026-08-09'), false, 'tomorrow');
  assert.equal(isLapsed('human_verified', '2026-08-09', '2026-08-09'), true, 'today');
  assert.equal(isLapsed('human_verified', '2026-08-08', '2026-08-09'), true, 'yesterday');
});

test('due soon is a warning, not a lapse', () => {
  assert.equal(isDueSoon('human_verified', '2026-09-15', '2026-08-09'), true);
  assert.equal(isDueSoon('human_verified', '2027-08-09', '2026-08-09'), false, 'a year out');
  assert.equal(isDueSoon('human_verified', '2026-08-08', '2026-08-09'), false, 'already lapsed');
  assert.equal(isDueSoon('requires_review', '2026-09-15', '2026-08-09'), false, 'never verified');
});

test('days until due counts calendar days and goes negative', () => {
  assert.equal(daysUntilDue('2026-08-19', '2026-08-09'), 10);
  assert.equal(daysUntilDue('2026-08-09', '2026-08-09'), 0);
  assert.equal(daysUntilDue('2026-08-01', '2026-08-09'), -8);
});

// -----------------------------------------------------------------------------
// How long a sign-off holds
// -----------------------------------------------------------------------------

test('riskier content is offered a shorter hold', () => {
  // Only the default. The person who just read it decides.
  assert.equal(defaultHold('high'), 6);
  assert.equal(defaultHold('medium'), 12);
  assert.equal(defaultHold('low'), 24);
});

test('a request cannot name its own interval', () => {
  // A form that could send any number could sign something off until 2099,
  // which is the same as never checking it again while looking as though
  // somebody had decided otherwise.
  assert.equal(asHoldMonths(6), 6);
  assert.equal(asHoldMonths('12'), 12);
  assert.equal(asHoldMonths(24), 24);
  assert.equal(asHoldMonths(1200), null);
  assert.equal(asHoldMonths(0), null);
  assert.equal(asHoldMonths(-6), null);
  assert.equal(asHoldMonths('forever'), null);
});

test('a hold never lands on a date that does not exist', () => {
  // 31 August plus six months is 31 February, which JavaScript rolls forward
  // into March. A hold that quietly ran three days longer than the reviewer
  // chose would be a small lie in the one place the app is asking to be
  // believed.
  assert.equal(dueDateFrom(6, new Date('2026-08-31T00:00:00Z')), '2027-02-28');
  assert.equal(dueDateFrom(6, new Date('2027-08-31T00:00:00Z')), '2028-02-29', 'leap year');
  assert.equal(dueDateFrom(12, new Date('2026-08-09T00:00:00Z')), '2027-08-09');
  assert.equal(dueDateFrom(24, new Date('2026-08-09T00:00:00Z')), '2028-08-09');
  assert.equal(dueDateFrom(6, new Date('2026-03-31T00:00:00Z')), '2026-09-30');
});

// -----------------------------------------------------------------------------
// What the queue does with a lapsed item
// -----------------------------------------------------------------------------

function item(over: Partial<ReviewItem>): ReviewItem {
  return {
    kind: 'question',
    id: 'id',
    versionId: null,
    slug: 'slug',
    domainName: null,
    heading: 'A question',
    scenario: null,
    body: null,
    options: [],
    correctOptionIds: [],
    explanation: null,
    whyItMatters: null,
    commonMisconception: null,
    memoryTrick: null,
    jurisdiction: 'AU_GENERAL',
    court: null,
    sourceReference: null,
    sourceUrl: null,
    sourceCheckedOn: null,
    status: 'published',
    verificationStatus: 'human_verified',
    reviewFlagged: false,
    reviewNote: null,
    reviewDueOn: null,
    lapsed: false,
    dueSoon: false,
    liveToLearners: false,
    risk: { level: 'low', score: 1, reasons: [] },
    ...over,
  };
}

test('a lapsed item counts as outstanding again', () => {
  // The number needing attention has to go back up by itself, or nobody ever
  // looks a second time.
  const stats = summarise([
    item({ slug: 'a' }),
    item({ slug: 'b', lapsed: true, reviewDueOn: '2020-01-01' }),
    item({ slug: 'c', verificationStatus: 'requires_review' }),
  ]);

  assert.equal(stats.verified, 1, 'only the one still in date');
  assert.equal(stats.outstanding, 2, 'the lapsed one and the never-checked one');
  assert.equal(stats.lapsed, 1);
  assert.equal(stats.total, 3);
});

test('a lapsed item is not sunk to the bottom with the signed-off ones', () => {
  const items = [
    item({ slug: 'signed-off' }),
    item({ slug: 'expired', lapsed: true }),
    item({ slug: 'never-checked', verificationStatus: 'requires_review' }),
  ];

  // Simplest first sinks what is done. A lapsed item is not done.
  const simplest = sortReviewItems(items, 'simplest').map((i) => i.slug);
  assert.equal(simplest[simplest.length - 1], 'signed-off');
  assert.ok(simplest.indexOf('expired') < simplest.indexOf('signed-off'));

  // Riskiest first puts anything live and unverified at the very top, then
  // anything whose sign-off has run out.
  const riskiest = sortReviewItems(
    [...items, item({ slug: 'live-unverified', liveToLearners: true, verificationStatus: 'unverified' })],
    'riskiest',
  ).map((i) => i.slug);
  assert.equal(riskiest[0], 'live-unverified');
  assert.equal(riskiest[1], 'expired');
});

// -----------------------------------------------------------------------------
// The database keeps the two in step
// -----------------------------------------------------------------------------

test('a verified row cannot exist without an expiry, and losing verification clears it', () => {
  assert.match(
    SCHEMA_ONLY,
    /if new\.verification_status = 'human_verified' then[\s\S]*?new\.review_due_on := current_date \+ interval '12 months'/,
    'a sign-off with no date gets the default rather than being left open-ended',
  );
  assert.match(
    SCHEMA_ONLY,
    /else\s*\n\s*new\.review_due_on := null;/,
    'anything not verified must not carry a due date: a flagged item is not "verified until March"',
  );

  for (const table of ['question_versions', 'daily_facts']) {
    assert.ok(
      SCHEMA_ONLY.includes(`before insert or update on public.${table}`),
      `${table} must be guarded on insert as well as update`,
    );
  }
});

test('the queue never claims something is signed off when it has lapsed', () => {
  // One definition, used by the filter and the counter. Two definitions is how
  // a queue comes to read "233 of 233 done" while still listing work.
  const source = fs.readFileSync(
    path.join(ROOT, 'src/app/admin/review/review-queue.tsx'),
    'utf8',
  );
  const matches = source.match(/verificationStatus === 'human_verified'/g) ?? [];
  assert.equal(
    matches.length,
    1,
    'there should be exactly one place deciding whether an item is signed off',
  );
  assert.match(
    source,
    /return item\.verificationStatus === 'human_verified' && !item\.lapsed;/,
    'and it must account for the sign-off having run out',
  );
});
