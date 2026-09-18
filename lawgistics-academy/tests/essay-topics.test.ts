import assert from 'node:assert/strict';
import test from 'node:test';

import { ESSAY_TOPICS, essayTopic, pickEssayTopic } from '../src/content/seed/essay-topics';

/**
 * The essay topic assigned from a diagnostic's priority domains.
 *
 * Priority domains arrive weakest-first (see recordDiagnosticResult in
 * src/lib/training/service.ts), so the first one with a matching topic wins.
 */

test('picks the topic matching the weakest priority domain', () => {
  const topic = pickEssayTopic(['advocacy', 'evidence']);
  assert.equal(topic.domain, 'advocacy');
});

test('falls through to the next priority domain if the first has no topic', () => {
  const topic = pickEssayTopic(['not-a-real-domain', 'drafting']);
  assert.equal(topic.domain, 'drafting');
});

test('falls back to a fixed default when nothing matches at all', () => {
  const topic = pickEssayTopic(['not-a-real-domain']);
  assert.equal(topic, ESSAY_TOPICS[0]);
});

test('falls back to the same fixed default given an empty list', () => {
  const topic = pickEssayTopic([]);
  assert.equal(topic, ESSAY_TOPICS[0]);
});

test('every topic has a unique slug', () => {
  const slugs = ESSAY_TOPICS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('essayTopic looks a topic up by slug', () => {
  const first = ESSAY_TOPICS[0];
  assert.equal(essayTopic(first.slug), first);
  assert.equal(essayTopic('not-a-real-slug'), undefined);
});
