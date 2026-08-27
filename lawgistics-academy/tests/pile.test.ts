import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyPile, citesAProvision, assertsLaw, asPile } from '../src/lib/review/pile';
import { QUESTIONS } from '../src/content/seed';

/**
 * Sorting the review queue by what kind of attention each item needs.
 *
 * The classifier has one asymmetric duty. Putting a craft question in the
 * check-the-citation pile wastes thirty seconds of a lawyer's reading. Putting
 * a statutory claim in the sign-from-experience pile puts an unsourced
 * proposition in front of somebody who is working quickly and on trust, and
 * they sign their name to it.
 *
 * So these tests are not symmetric either. The ones that matter are the ones
 * asserting nothing statutory reaches the easy pile.
 */

const craft = (text: string) => classifyPile({ sourceReference: null, text });

test('a citation with a pinpoint is something to read and confirm', () => {
  for (const source of [
    'Courts of Judicature Act 1964 s 96(a)',
    'Federal Constitution art 121(1A)',
    'Rules of Court 2012 O 14',
    'Evidence Act 1950 s 114 illustration (g)',
    'Interpretation Acts 1948 and 1967 s 17A',
    'Rules of Court 2012 O 18 r 19',
    // Spelled out, which is how an explanation writes it rather than how a
    // citation does.
    'Rules of Court 2012, Order 53',
    'Federal Constitution, Article 121',
    'Evidence Act 1950, section 114',
  ]) {
    assert.equal(
      classifyPile({ sourceReference: source, text: 'anything' }),
      'check_the_citation',
      source,
    );
  }
});

test('naming an instrument without a provision is not a citation', () => {
  // "Rules of Court 2012" is a book. Nobody can check a claim against a book,
  // so these belong with the ones that have no source at all.
  for (const source of [
    'Rules of Court 2012',
    'Evidence Act 1950',
    'Subordinate Courts Act 1948',
    'Legal Profession (Practice and Etiquette) Rules 1978',
    // The trap in spelling the forms out: the number after "Rules" here is the
    // year in the instrument's name, not a place inside it.
    'Bar Council Circular No 342/2023',
    'Companies Regulations 2017',
  ]) {
    assert.equal(
      classifyPile({ sourceReference: source, text: 'anything' }),
      'find_a_citation',
      source,
    );
    assert.equal(citesAProvision(source), false, source);
  }
});

test('craft with no source and no provision is signable from experience', () => {
  for (const text of [
    'Where should you start a research task? With a practitioner text, to get the framework.',
    'What does it mean to say a decision is binding on a later court?',
    'A judge interrupts your submission. What do you do? Answer the question when it is asked.',
    'Who has adopted the contents as their own?',
    'Before relying on a judgment, check how it has been treated since.',
  ]) {
    assert.equal(craft(text), 'sign_from_experience', text.slice(0, 40));
  }
});

test('a rule of law with no source never reaches the easy pile', () => {
  // The failure this whole thing exists to prevent.
  for (const text of [
    'The Sessions Court limit is set by the Subordinate Courts Act 1948.',
    'Appeals go to the High Court under ss 27 to 28.',
    'A defendant has 14 days to enter appearance under O 12.',
    'Article 121(1A) removes the civil courts’ jurisdiction.',
    'See reg 5 of the Regulations.',
    'The Evidence Act governs this.',
    'Practice Direction No 2 applies.',
  ]) {
    assert.equal(craft(text), 'find_a_citation', text.slice(0, 40));
    assert.equal(assertsLaw(text), true, text.slice(0, 40));
  }
});

test('every item lands in exactly one pile, and the piles add up', () => {
  const counts = { sign_from_experience: 0, check_the_citation: 0, find_a_citation: 0 };

  for (const q of QUESTIONS) {
    const pile = classifyPile({
      sourceReference: q.sourceReference ?? null,
      text: [q.scenario ?? '', q.stem, q.explanation, q.commonMisconception ?? ''].join(' '),
    });
    counts[pile] += 1;
  }

  const total = counts.sign_from_experience + counts.check_the_citation + counts.find_a_citation;
  assert.equal(total, QUESTIONS.length, 'nothing is dropped and nothing is counted twice');

  // Not a snapshot of exact numbers, which would fail every time a question is
  // added. What must stay true is that all three piles have something in them:
  // a classifier that put everything in one bucket would still "add up".
  assert.ok(counts.sign_from_experience > 0, 'some questions are craft');
  assert.ok(counts.check_the_citation > 0, 'some questions cite a provision');
  assert.ok(counts.find_a_citation > 0, 'some questions still need one');
});

test('the pile in a query string is validated, not trusted', () => {
  assert.equal(asPile('sign_from_experience'), 'sign_from_experience');
  assert.equal(asPile('check_the_citation'), 'check_the_citation');
  assert.equal(asPile(undefined), null);
  assert.equal(asPile(''), null);
  assert.equal(asPile('everything'), null);
  assert.equal(asPile('__proto__'), null);
  assert.equal(asPile('constructor'), null);
});
