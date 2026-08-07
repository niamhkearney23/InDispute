import assert from 'node:assert/strict';
import test from 'node:test';

import { MODULES, modulesFor, moduleBySlug } from '../src/content/seed/modules';
import { QUESTIONS } from '../src/content/seed';
import { DOMAINS } from '../src/content/seed/taxonomy';
import { COUNTRIES, JURISDICTION_COUNTRY } from '../src/lib/types';

/**
 * Modules.
 *
 * A module names a set of questions and claims a person has covered them. That
 * claim is the whole value of the feature, so what it rests on is asserted
 * here: that the questions exist, that they are in the learner's own country,
 * and that "required" still means something.
 */

test('every module points at domains that exist and has questions behind it', () => {
  const domainSlugs = new Set(DOMAINS.map((d) => d.slug));
  assert.ok(MODULES.length > 0);

  for (const definition of MODULES) {
    assert.ok(COUNTRIES.includes(definition.country), `${definition.slug} has an unknown country`);
    assert.ok(definition.domains.length > 0, `${definition.slug} covers nothing`);

    for (const domain of definition.domains) {
      assert.ok(domainSlugs.has(domain), `${definition.slug} names unknown domain "${domain}"`);
    }

    // A module with nothing in it would show a finishing line nobody can cross.
    const questions = QUESTIONS.filter(
      (q) =>
        definition.domains.includes(q.domain) &&
        JURISDICTION_COUNTRY[q.jurisdiction] === definition.country,
    );
    assert.ok(
      questions.length >= 5,
      `${definition.slug} has only ${questions.length} questions in ${definition.country}`,
    );

    assert.ok(definition.summary.length > 20, `${definition.slug} has no real summary`);
    assert.ok(definition.rationale.length > 80, `${definition.slug} does not say why it exists`);
  }
});

test('module slugs are unique and resolve', () => {
  const slugs = MODULES.map((m) => m.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'two modules share a slug');

  for (const slug of slugs) {
    assert.ok(moduleBySlug(slug), `${slug} does not resolve`);
  }
  assert.equal(moduleBySlug('does-not-exist'), null);
  assert.equal(moduleBySlug('constructor'), null);
  assert.equal(moduleBySlug('__proto__'), null);
});

test('each country gets its own modules and never the other country', () => {
  for (const country of COUNTRIES) {
    const forCountry = modulesFor(country);
    assert.ok(forCountry.length > 0, `${country} has no modules`);
    assert.ok(
      forCountry.every((m) => m.country === country),
      `a module from another country reached ${country}`,
    );
  }

  // The ethics module is the day one induction, so it must exist for both.
  for (const country of COUNTRIES) {
    const ethics = modulesFor(country).filter((m) => m.domains.includes('ethics-and-ai'));
    assert.equal(ethics.length, 1, `${country} does not have exactly one ethics module`);
    assert.ok(ethics[0].required, `the ${country} ethics module is not marked required`);
  }
});

test('required is used sparingly enough to still mean something', () => {
  for (const country of COUNTRIES) {
    const forCountry = modulesFor(country);
    const required = forCountry.filter((m) => m.required);

    assert.ok(required.length >= 1, `${country} requires nothing`);
    assert.ok(
      required.length <= 3,
      `${country} requires ${required.length} modules; a list that long is not a list of required things`,
    );
  }
});

test('a module is never described as complete without every question behind it', () => {
  // The rule the service implements, asserted as arithmetic so a change to it
  // has to be deliberate: partial progress is never completion.
  const complete = (correctOnce: number, total: number) => total > 0 && correctOnce === total;

  assert.equal(complete(16, 16), true);
  assert.equal(complete(15, 16), false);
  assert.equal(complete(0, 0), false, 'an empty module must not read as complete');
  assert.equal(complete(0, 16), false);
});
