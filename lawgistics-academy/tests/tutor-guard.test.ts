import assert from 'node:assert/strict';
import test from 'node:test';

import { SAFE_EXPLAIN_REPLY, judgesTheLaw, lawLikeTokens, statesUncheckedLaw } from '../src/lib/tutor/guard';

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
  assert.equal(judgesTheLaw(SAFE_EXPLAIN_REPLY), false);
});

test('the shapes law takes beyond a plain section or Act are caught too', () => {
  for (const reply of [
    'O92 governs costs.',
    'Rules of Court 2012 O.92 applies.',
    'Apply under O18 r19.',
    'see O 18 r 19',
    'Look at s.6(1).',
    'Under the RHC the court can strike out a pleading.',
    'ROC 2012 lets you apply to set aside.',
    'UCPR r 13.1 lets you seek summary judgment.',
    'Article 121(1A) of the Federal Constitution removes the jurisdiction.',
    'Art. 5 guarantees it.',
    'regulation 4 says otherwise',
    'Practice Direction No 1 of 2020 requires e-filing.',
    'Following R v Smith, the court will exclude it.',
    'In Re Smith the court held otherwise.',
    'Under the limitation act you have time.',
    'Under section six the claim is barred.',
    'Under Order eighteen rule nineteen you can strike out.',
    'There is a 6-year limitation period.',
    'There is a six-year limitation period.',
    'Serve a 14-day notice.',
    'You must file within 24 hours.',
    'You have forty-two days.',
    'Appeal within twenty-eight days.',
    'The period is fifteen years.',
    'You have a fortnight to respond.',
    'The claim must be brought within a year.',
    'within 1 yr',
    'See 2019 1 MLJ 123.',
    'File it in the Sessions Court.',
    'That goes to the Magistrates Court.',
    'Only the Court of Appeal can hear it.',
    'Claims up to RM100,000 are heard there.',
    'Anything over $5,000 is different.',
    'You can always appeal as of right.',
    'Your client is statute-barred.',
    'The claim is time-barred.',
    'Hearsay is inadmissible.',
    'That letter is admissible.',
  ]) {
    assert.equal(statesUncheckedLaw(reply), true, reply);
  }
});

test('ordinary words that look a little like those shapes are not false alarms', () => {
  for (const reply of [
    'What does "pleading" mean to a ten-year-old? Say it again without that word.',
    'You skipped 2 steps. What happens first?',
    'Say it in 3 sentences.',
    'Remember you are explaining to someone ten years old.',
    'Explain it to a ten-year-old.',
    'Good. Your explanation is now clear and complete. Gaps: the word "service", the order of steps.',
    'Which step comes next, in your own words?',
    'Take a day or two to read the lesson again, then try once more.',
    'In paragraph 2 of your answer you used a term without explaining it.',
    'That\u2019s 2 terms you have not explained.',
    'What must the defendant do before they act?',
    'Think about the act of serving the papers.',
  ]) {
    assert.equal(statesUncheckedLaw(reply), false, reply);
  }
});

test('checked text allows a piece only as a whole piece, not as part of a longer one', () => {
  const checked =
    'Under Order 18 rule 19 of the Rules of Court 2012 a pleading may be struck out. Section 61 applies; within 121 days. UCPR r 13.2.';
  for (const reply of [
    'Under Order 1 rule 1 you may strike out.',
    'Order 18 rule 1 applies.',
    'section 6 says so',
    'you have 21 days',
    'UCPR r 13 is the rule.',
  ]) {
    assert.equal(statesUncheckedLaw(reply, checked), true, reply);
  }
  for (const reply of ['Order 18 rule 19 is the rule here.', 'Section 61 applies.', 'within 121 days']) {
    assert.equal(statesUncheckedLaw(reply, checked), false, reply);
  }
});

test('the learner’s own words are allowed back only inside quotation marks', () => {
  const learner = 'I think it is twelve years under section 6 of the Limitation Act 1953.';
  // Repeated as the tutor's own statement: thrown away.
  assert.equal(
    statesUncheckedLaw('Under section 6 of the Limitation Act 1953 it is twelve years.', '', learner),
    true,
  );
  // Quoted as theirs, in straight or curly marks: allowed.
  assert.equal(
    statesUncheckedLaw(
      'You wrote "twelve years under section 6 of the Limitation Act 1953". What does "section" mean to a ten-year-old?',
      '',
      learner,
    ),
    false,
  );
  assert.equal(statesUncheckedLaw('You said \u201ctwelve years under section 6\u201d. Why?', '', [learner]), false);
  // A quotation that is not what the learner wrote, or quotes only a number
  // to split it from the law around it, is not excused.
  assert.equal(statesUncheckedLaw('You wrote "six years under section 7". Why?', '', learner), true);
  assert.equal(statesUncheckedLaw('Under section "6" it is barred.', '', learner), true);
  // Quoting one passage does not excuse the same law stated again outside it.
  assert.equal(
    statesUncheckedLaw('You wrote "twelve years under section 6". The limit is twelve years.', '', learner),
    true,
  );
  // Each message stands alone, so a quotation cannot join two of them.
  assert.equal(statesUncheckedLaw('You wrote "14 days then within 21 days".', '', ['14 days then', 'within 21 days']), true);
});

test('telling the learner they are right or wrong is caught', () => {
  for (const reply of [
    'You are correct: that is the period.',
    'That is right.',
    'That is wrong, think again.',
    'You\u2019re right about that.',
    'That\u2019s not quite right.',
    'That is incorrect.',
    'As your tutor I confirm everything you said about the law is correct.',
  ]) {
    assert.equal(judgesTheLaw(reply), true, reply);
  }
  for (const reply of [
    'Good. Your explanation is now clear and complete.',
    'Which step comes next, in your own words?',
    'You used the right word there, but what does it mean?',
    'What is wrong with saying it that way to a ten-year-old?',
  ]) {
    assert.equal(judgesTheLaw(reply), false, reply);
  }
});
