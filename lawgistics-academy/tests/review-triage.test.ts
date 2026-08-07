import assert from 'node:assert/strict';
import test from 'node:test';

import { reviewRisk } from '../src/lib/review/triage';
import { asReviewOrder, sortReviewItems, type ReviewItem } from '../src/lib/review/service';
import { QUESTIONS, FACTS } from '../src/content/seed';

/**
 * Review triage.
 *
 * The job is to put the items most likely to contain an error in front of the
 * reviewer first. A triage that rates everything the same has done nothing, so
 * the distribution is asserted, not just the individual rules.
 */

test('an item with no source at all is always worth checking', () => {
  const risk = reviewRisk({
    text: 'The limitation period is six years.',
    jurisdiction: 'AU_GENERAL',
  });

  assert.notEqual(risk.level, 'low');
  assert.ok(risk.reasons.some((r) => r.includes('No source')));
});

test('a pinpoint provision is flagged for checking', () => {
  const risk = reviewRisk({
    text: 'Summary judgment is available where there is no real prospect of success.',
    jurisdiction: 'VIC',
    sourceReference: 'Civil Procedure Act 2010 (Vic) s 63',
  });

  assert.ok(risk.reasons.some((r) => r.includes('specific provision')));
  assert.ok(risk.reasons.some((r) => r.includes('Jurisdiction-specific')));
});

test('a monetary figure is flagged; those get adjusted', () => {
  const risk = reviewRisk({
    text: 'The jurisdictional limit is $100,000.',
    jurisdiction: 'VIC',
    sourceReference: 'Magistrates’ Court Act 1989 (Vic)',
  });

  assert.equal(risk.level, 'high');
  assert.ok(risk.reasons.some((r) => r.includes('monetary')));
});

test('a settled general principle with a source rates lower than a jurisdictional rule', () => {
  const general = reviewRisk({
    text: 'The party who asserts must prove.',
    jurisdiction: 'AU_GENERAL',
    sourceReference: 'General principle',
  });
  const specific = reviewRisk({
    text: 'The limitation period is six years from accrual.',
    jurisdiction: 'VIC',
    sourceReference: 'Limitation of Actions Act 1958 (Vic) s 5',
  });

  assert.ok(
    specific.score > general.score,
    'a jurisdiction-specific rule citing a provision must outrank a general principle',
  );
});

test('a year is not counted twice when a provision or case is already cited', () => {
  // Both mention a year. Only the one without a pinpoint citation should get
  // the extra point, otherwise almost every item scores the same and the
  // ordering stops meaning anything.
  const withProvision = reviewRisk({
    text: 'Section 15AA was inserted in 1981.',
    jurisdiction: 'AU_GENERAL',
    sourceReference: 'Acts Interpretation Act 1901 (Cth) s 15AA',
  });
  const withoutProvision = reviewRisk({
    text: 'The building opened in 1980.',
    jurisdiction: 'AU_GENERAL',
    sourceReference: 'Court website',
  });

  assert.ok(!withProvision.reasons.includes('States a date'));
  assert.ok(withoutProvision.reasons.includes('States a date'));
});

test('the triage actually separates the shipped bank into usable groups', () => {
  const scored = [
    ...QUESTIONS.map((q) =>
      reviewRisk({
        text: [q.stem, q.scenario, q.explanation, q.whyItMatters].filter(Boolean).join(' '),
        jurisdiction: q.jurisdiction,
        sourceReference: q.sourceReference,
        sourceUrl: q.sourceUrl,
      }),
    ),
    ...FACTS.map((f) =>
      reviewRisk({
        text: `${f.title} ${f.body} ${f.whyItMatters ?? ''}`,
        jurisdiction: f.jurisdiction,
        sourceReference: f.sourceReference,
        sourceUrl: f.sourceUrl,
      }),
    ),
  ];

  const high = scored.filter((r) => r.level === 'high').length;
  const low = scored.filter((r) => r.level === 'low').length;

  // "Check closely" has to be a set someone can get through in one sitting. If
  // it swells past a third of the bank it has stopped prioritising anything.
  assert.ok(high >= 10, `only ${high} items rated high; the triage is not finding anything`);
  assert.ok(
    high <= scored.length / 3,
    `${high} of ${scored.length} rated high; that is not a priority list`,
  );
  assert.ok(low >= 5, `only ${low} items rated low; nothing is being de-prioritised`);
});

test('every shipped item gets at least one concrete reason to check it, or is genuinely low risk', () => {
  for (const q of QUESTIONS) {
    const risk = reviewRisk({
      text: [q.stem, q.explanation].filter(Boolean).join(' '),
      jurisdiction: q.jurisdiction,
      sourceReference: q.sourceReference,
      sourceUrl: q.sourceUrl,
    });
    if (risk.level !== 'low') {
      assert.ok(risk.reasons.length > 0, `${q.slug} is flagged but says nothing about why`);
    }
  }
});

/* --- queue ordering ------------------------------------------------------- */

test('simplest first puts the low risk items at the top, and is not just the reverse', () => {
  const item = (slug: string, score: number, verified: boolean, live: boolean) =>
    ({
      slug,
      risk: { score, level: 'low' as const, reasons: [] },
      verificationStatus: verified ? 'human_verified' : 'unverified',
      liveToLearners: live,
    }) as unknown as ReviewItem;

  const items = [
    item('hard', 8, false, true),
    item('easy', 0, false, false),
    item('middling', 4, false, false),
    item('easy-but-done', 0, true, false),
  ];

  const simplest = sortReviewItems(items, 'simplest').map((i) => i.slug);

  // Signed-off items sink whichever way round it is sorted: there is nothing
  // left to do with them, so they must not occupy the top of the list.
  assert.deepEqual(simplest, ['easy', 'middling', 'hard', 'easy-but-done']);

  const riskiest = sortReviewItems(items, 'riskiest').map((i) => i.slug);
  assert.equal(riskiest[0], 'hard', 'live and unverified still comes first');
});

test('the order asked for in a URL is narrowed to the two we support', () => {
  assert.equal(asReviewOrder('simplest'), 'simplest');
  assert.equal(asReviewOrder('riskiest'), 'riskiest');
  assert.equal(asReviewOrder(undefined), 'riskiest');
  assert.equal(asReviewOrder('constructor'), 'riskiest');
  assert.equal(asReviewOrder('; drop table questions'), 'riskiest');
});
