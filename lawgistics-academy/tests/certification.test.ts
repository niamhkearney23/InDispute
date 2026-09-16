import assert from 'node:assert/strict';
import test from 'node:test';

import { bestGradePerBox, computeCertificationStatus } from '../src/lib/certification/service';
import { SPINE_BOX_NUMBERS } from '../src/content/seed/certification-boxes';

/**
 * Certification is ten boxes at Level 3, and the ten must include every box
 * in the spine (1 to 6) plus at least one advocacy box (11 to 15). This is
 * pure and tested directly for the same reason resumeIndexFor and
 * isFromToday are: the interesting cases are awkward to set up through the
 * database and trivial to hand a list of entries.
 */

function entry(boxNumber: number, grade: 'l1_observed' | 'l2_assisted' | 'l3_independent' | null) {
  return { boxNumber, grade };
}

test('nobody is certified with no entries at all', () => {
  const status = computeCertificationStatus([]);
  assert.equal(status.certified, false);
  assert.deepEqual(status.boxesAtL3, []);
  assert.deepEqual(status.missingSpineBoxes, SPINE_BOX_NUMBERS);
  assert.equal(status.hasAdvocacyBox, false);
});

test('not certified below ten boxes at L3, even with the spine and an advocacy box done', () => {
  const entries = [1, 2, 3, 4, 5, 6, 11].map((n) => entry(n, 'l3_independent'));
  const status = computeCertificationStatus(entries);
  assert.equal(status.boxesAtL3.length, 7);
  assert.deepEqual(status.missingSpineBoxes, []);
  assert.equal(status.hasAdvocacyBox, true);
  assert.equal(status.certified, false);
});

test('not certified with ten boxes at L3 if a spine box is missing', () => {
  // Spine box 6 never attempted; padded out to ten with everything else.
  const entries = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11].map((n) => entry(n, 'l3_independent'));
  const status = computeCertificationStatus(entries);
  assert.equal(status.boxesAtL3.length, 10);
  assert.deepEqual(status.missingSpineBoxes, [6]);
  assert.equal(status.certified, false);
});

test('not certified with ten boxes at L3 and the full spine, but no advocacy box', () => {
  const entries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => entry(n, 'l3_independent'));
  const status = computeCertificationStatus(entries);
  assert.equal(status.boxesAtL3.length, 10);
  assert.deepEqual(status.missingSpineBoxes, []);
  assert.equal(status.hasAdvocacyBox, false);
  assert.equal(status.certified, false);
});

test('certified at exactly the minimum required set', () => {
  // The full spine, three of the non-spine non-advocacy boxes, and one
  // advocacy box: ten boxes, everything the rule asks for and nothing more.
  const entries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11].map((n) => entry(n, 'l3_independent'));
  const status = computeCertificationStatus(entries);
  assert.equal(status.boxesAtL3.length, 10);
  assert.deepEqual(status.missingSpineBoxes, []);
  assert.equal(status.hasAdvocacyBox, true);
  assert.equal(status.certified, true);
});

test('a box counts once graded L3 on any case, not only the most recent', () => {
  const entries = [
    entry(1, 'l2_assisted'),
    entry(1, 'l3_independent'),
    entry(2, 'l3_independent'),
    entry(2, 'l2_assisted'),
  ];
  const status = computeCertificationStatus(entries);
  assert.deepEqual(status.boxesAtL3, [1, 2]);
});

test('a box graded L1 or L2 only does not count toward certification', () => {
  const entries = [1, 2, 3, 4, 5, 6, 11].map((n) => entry(n, 'l3_independent'));
  entries.push(entry(7, 'l2_assisted'), entry(8, 'l1_observed'));
  const status = computeCertificationStatus(entries);
  assert.equal(status.boxesAtL3.length, 7);
  assert.equal(status.certified, false);
});

test('bestGradePerBox keeps the highest grade recorded for each box', () => {
  const entries = [
    entry(1, 'l1_observed'),
    entry(1, 'l3_independent'),
    entry(1, 'l2_assisted'),
    entry(2, 'l2_assisted'),
  ];
  const grid = bestGradePerBox(entries);
  assert.equal(grid.get(1), 'l3_independent');
  assert.equal(grid.get(2), 'l2_assisted');
  assert.equal(grid.has(3), false);
});

test('bestGradePerBox ignores ungraded entries', () => {
  const grid = bestGradePerBox([entry(1, null), entry(2, 'l3_independent')]);
  assert.equal(grid.has(1), false);
  assert.equal(grid.get(2), 'l3_independent');
});
