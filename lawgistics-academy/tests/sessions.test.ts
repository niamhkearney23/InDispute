import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { isEmbeddable } from '../src/lib/lessons/embed';
import { leadSession } from '../src/lib/lessons/sessions';
import type { CoachSession } from '../src/lib/lessons/sessions';

/**
 * The coach's own sessions.
 *
 * Two things have to hold. A session dated for a morning that has not arrived
 * must not appear, because giving away Friday's work on Wednesday wastes the
 * one thing the coach actually controls. And the link must be one we chose,
 * because an iframe src is somebody else's page running inside ours.
 */

const ROOT = path.join(import.meta.dirname, '..');

function session(over: Partial<CoachSession> = {}): CoachSession {
  return {
    id: over.id ?? 'a',
    title: over.title ?? 'A session',
    summary: '',
    url: 'https://www.youtube-nocookie.com/embed/abc',
    country: null,
    airsOn: over.airsOn ?? null,
    published: true,
    publishedByName: null,
    publishedAt: null,
    position: 0,
    ...over,
  };
}

test('a session dated ahead does not lead before its morning', () => {
  // The list arrives newest first, which is how the query orders it.
  const list = [
    session({ id: 'fri', airsOn: '2026-09-04' }),
    session({ id: 'wed', airsOn: '2026-09-02' }),
    session({ id: 'mon', airsOn: '2026-08-31' }),
  ];

  assert.equal(leadSession(list, '2026-09-02')?.id, 'wed', 'Wednesday leads on Wednesday');
  assert.equal(leadSession(list, '2026-09-03')?.id, 'wed', 'and still on Thursday');
  assert.equal(leadSession(list, '2026-09-04')?.id, 'fri', 'Friday takes over on Friday');
  assert.equal(leadSession(list, '2026-08-30')?.id, undefined, 'nothing has aired yet');
});

test('an undated session is always available to lead', () => {
  // Not everything belongs to a morning. Something in the library should not be
  // hidden for want of a date.
  const list = [session({ id: 'library', airsOn: null })];
  assert.equal(leadSession(list, '2026-08-30')?.id, 'library');
});

test('nothing at all is a null, not a crash', () => {
  assert.equal(leadSession([], '2026-08-30'), null);
});

test('a watch link is refused, an embed link is accepted', () => {
  // The mistake everybody makes: copying the address bar rather than the embed
  // address from the share menu. A watch link cannot be framed, so it has to be
  // refused loudly rather than saved and left to fail at seven in the morning.
  assert.equal(isEmbeddable('https://www.youtube.com/watch?v=abc'), true, 'host is ours');
  assert.equal(isEmbeddable('https://www.youtube-nocookie.com/embed/abc'), true);
  assert.equal(isEmbeddable('https://player.vimeo.com/video/123'), true);

  assert.equal(isEmbeddable('https://vimeo.com/123'), false, 'vimeo.com is not the player host');
  assert.equal(isEmbeddable('http://www.youtube.com/embed/abc'), false, 'plain http');
  assert.equal(isEmbeddable('https://evil.example/embed/abc'), false);
  assert.equal(isEmbeddable('javascript:alert(1)'), false);
  assert.equal(isEmbeddable('not a url'), false);
  assert.equal(
    isEmbeddable('https://www.youtube.com.evil.example/embed/abc'),
    false,
    'a host that merely starts with one of ours',
  );
});

test('the database constraint and the player agree about hosts', () => {
  /* Two guards on the same door, and they must not drift. If the constraint were
     narrower than the player, the coach would be refused a link the app said was
     fine. If it were wider, a row could exist that renders as a dead frame. */
  const migration = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/0012_coach_videos.sql'),
    'utf8',
  );
  const embed = fs.readFileSync(path.join(ROOT, 'src/lib/lessons/embed.ts'), 'utf8');

  for (const host of ['youtube.com', 'youtube-nocookie.com', 'player.vimeo.com']) {
    assert.ok(
      migration.includes(host.replace(/\./g, '\\.')),
      `the constraint should name ${host}`,
    );
    assert.ok(embed.includes(host), `the player should name ${host}`);
  }

  assert.match(migration, /https:\/\//, 'the constraint requires https, as the player does');
});

test('a session is never given a verification status', () => {
  /* The queue exists to sign off statements of law we are answerable for. A
     stamp saying a video had been checked, on a recording nobody transcribed,
     would be the most misleading thing in the product. */
  const migration = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/0012_coach_videos.sql'),
    'utf8',
  );
  // Comments stripped first. The file says at the top that there is deliberately
  // no verification_status, and a check that reads the prose would fail on the
  // sentence promising the thing it is checking for.
  const sql = migration.replace(/^\s*--.*$/gm, '');
  assert.ok(
    !/verification_status|reviewed_by|review_due_on/.test(sql),
    'sessions must not carry the vocabulary of a sign-off they never had',
  );
});

test('there is no way to delete a session', () => {
  // Somebody watched it. Unpublishing is the undo; deleting is not offered.
  const actions = fs.readFileSync(
    path.join(ROOT, 'src/app/admin/sessions/actions.ts'),
    'utf8',
  );
  assert.ok(!/\.delete\(/.test(actions), 'no delete on the sessions table');
});
