import assert from 'node:assert/strict';
import test from 'node:test';

import { SAFE_EXPLAIN_REPLY, lawLikeTokens, statesUncheckedLaw } from '../src/lib/tutor/guard';

test('a reply that states law is caught, whatever shape the law takes', () => {
  for (const reply of [
    'You have 14 days to apply under Order 13 rule 8.',
    'Section 466 of the Companies Act 2016 says so.',
    'Under s. 6 the claim is barred.',
    'See Smith v Jones on this point.',
    'In [2019] 1 MLJ 23 the court held it.',
    'The limitation period is six years.',
  ]) {
    assert.equal(statesUncheckedLaw(reply), true, reply);
  }
});

test('an ordinary tutor reply, a question about the learner’s own words, passes', () => {
  for (const reply of [
    'You said, "the plaintiff gets a JID." What does JID mean, in plain words?',
    'You have skipped a step. What happens before the judgment is entered?',
    'That sounds doubtful. Check that point against the lesson or ask your coach.',
    'Not quite. Your reason treats the top of the hierarchy as the next step up.',
    'What would a ten-year-old need to know first?',
  ]) {
    assert.equal(statesUncheckedLaw(reply), false, reply);
  }
});

test('law that is already in the checked text, or the learner’s own words, is allowed', () => {
  assert.equal(
    statesUncheckedLaw('As the explanation says, appeal within 14 days.', 'Appeal within 14 days.'),
    false,
  );
  assert.equal(
    statesUncheckedLaw('As the explanation says, appeal within 21 days.', 'Appeal within 14 days.'),
    true,
  );
});

test('the fallback reply is itself free of law', () => {
  assert.deepEqual(lawLikeTokens(SAFE_EXPLAIN_REPLY), []);
});
