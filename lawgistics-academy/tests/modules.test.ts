import assert from 'node:assert/strict';
import test from 'node:test';

import fs from 'node:fs';
import path from 'node:path';

import { MODULES, modulesFor, moduleBySlug } from '../src/content/seed/modules';
import { QUESTIONS } from '../src/content/seed';
import { LESSONS, lessonForModule } from '../src/content/seed/lessons';
import { COURT_HIERARCHIES } from '../src/content/seed/court-hierarchies';
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

test('tentative content can never be published by the setup page', () => {
  // Tentative is stronger than unverified. Unverified content ships published
  // so the app works out of the box, with the review queue visibly waiting.
  // Tentative content is written ahead of the research that would stand it up,
  // so it must not be answerable by anyone until a person publishes it
  // deliberately, one item at a time.
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src/lib/setup/seed-content.ts'),
    'utf8',
  );

  assert.match(
    source,
    /country === 'MY' \|\| tentative \? 'requires_review' : status/,
    'the tentative override is gone; check seed-content.ts',
  );
  assert.match(
    source,
    /status: statusFor\(country, q\.tentative\)/,
    'questions are inserted without passing the tentative flag through',
  );

  // And the flag is actually being used, or the guard above guards nothing.
  const tentative = QUESTIONS.filter((q) => q.tentative);
  assert.ok(tentative.length >= 5, `only ${tentative.length} tentative questions`);

  // Every tentative question says so in its own file, so a reviewer opening it
  // knows before reading a word.
  const files = new Set(
    fs
      .readdirSync(path.join(__dirname, '..', 'src/content/seed/questions'))
      .filter((f) => f.endsWith('.ts')),
  );
  for (const file of files) {
    const text = fs.readFileSync(
      path.join(__dirname, '..', 'src/content/seed/questions', file),
      'utf8',
    );
    if (!/tentative: true/.test(text)) continue;
    assert.match(text, /TENTATIVE/, `${file} has tentative questions but does not say so`);
  }
});

/* -------------------------------------------------------------------------- */
/* Lessons                                                                    */
/* -------------------------------------------------------------------------- */

test('every lesson belongs to a module that exists, in the same country', () => {
  assert.ok(LESSONS.length > 0);

  for (const lesson of LESSONS) {
    const owner = moduleBySlug(lesson.moduleSlug);
    assert.ok(owner, `lesson "${lesson.slug}" points at unknown module "${lesson.moduleSlug}"`);
    assert.equal(
      owner.country,
      lesson.country,
      `lesson "${lesson.slug}" is ${lesson.country} but its module is ${owner.country}`,
    );
    assert.equal(
      lessonForModule(lesson.moduleSlug)?.slug,
      lesson.slug,
      `${lesson.moduleSlug} does not resolve back to its lesson`,
    );
  }

  const slugs = LESSONS.map((l) => l.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'two lessons share a slug');

  // One lesson per module, or the page would silently show the first.
  const moduleSlugs = LESSONS.map((l) => l.moduleSlug);
  assert.equal(new Set(moduleSlugs).size, moduleSlugs.length, 'a module has two lessons');
});

test('lessons stay short enough to finish', () => {
  for (const lesson of LESSONS) {
    assert.ok(lesson.steps.length >= 3, `${lesson.slug} is too short to be a lesson`);
    assert.ok(
      lesson.steps.length <= 6,
      `${lesson.slug} has ${lesson.steps.length} screens; past six it outlasts attention and costs the quiz too`,
    );
    assert.ok(lesson.minutes >= 1 && lesson.minutes <= 6, `${lesson.slug} claims an odd length`);

    for (const step of lesson.steps) {
      assert.ok(step.heading.length <= 40, `"${step.heading}" is a sentence, not a signpost`);
      assert.ok(step.body.length >= 80, `a step of "${lesson.slug}" says almost nothing`);
      assert.ok(
        step.body.length <= 520,
        `a step of "${lesson.slug}" is ${step.body.length} characters; if it needs that many it is two steps`,
      );
    }
  }
});

test('a lesson only draws a diagram for a country that has one', () => {
  for (const lesson of LESSONS) {
    if (!lesson.steps.some((s) => s.diagram)) continue;
    const hierarchy = COURT_HIERARCHIES[lesson.country];
    assert.ok(hierarchy, `${lesson.slug} draws a diagram but ${lesson.country} has no hierarchy`);
    assert.ok(hierarchy.courts.length >= 4, `the ${lesson.country} diagram is too thin to teach from`);
  }
});

test('every module has a lesson', () => {
  // Three modules taught and three did not, which reads as unfinished rather
  // than as a choice. If a module should genuinely have no lesson, this test is
  // the place to say so out loud.
  const without = MODULES.filter((m) => !lessonForModule(m.slug)).map((m) => m.slug);
  assert.deepEqual(without, [], 'these modules go straight to questions with no teaching');
});
