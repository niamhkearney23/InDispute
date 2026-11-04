import assert from 'node:assert/strict';
import test from 'node:test';
import { prioritiseWork } from '../src/lib/work/queue';

const post = (id: string, waiting = 0, unanswered = 0) => ({ id, waiting, unanswered });
const ids = (posts: ReturnType<typeof post>[]) => posts.map((entry) => entry.id);

test('older handed-in work is visible before a new post with nothing to mark', () => {
  assert.deepEqual(ids(prioritiseWork([post('new'), post('older', 1)])), ['older', 'new']);
});

test('unanswered conversations come before other work and after marking', () => {
  assert.deepEqual(
    ids(prioritiseWork([post('ordinary'), post('reply', 0, 2), post('mark', 1)])),
    ['mark', 'reply', 'ordinary'],
  );
});

test('a post needing both a mark and a reply appears once in the marking group', () => {
  const both = post('both', 1, 3);
  const ordered = prioritiseWork([post('reply', 0, 1), both, post('ordinary')]);
  assert.deepEqual(ids(ordered), ['both', 'reply', 'ordinary']);
  assert.equal(ordered.filter((entry) => entry === both).length, 1);
});

test('each group keeps the board order and the original entries and counts', () => {
  const original = [
    post('other-a'), post('mark-a', 1), post('reply-a', 0, 1),
    post('mark-b', 3, 2), post('other-b'), post('reply-b', 0, 4),
  ];
  original.forEach(Object.freeze);
  Object.freeze(original);
  const ordered = prioritiseWork(original);
  assert.deepEqual(ids(ordered), ['mark-a', 'mark-b', 'reply-a', 'reply-b', 'other-a', 'other-b']);
  assert.deepEqual(ids([...original]), ['other-a', 'mark-a', 'reply-a', 'mark-b', 'other-b', 'reply-b']);
  assert.equal(ordered.length, original.length);
  assert.ok(ordered.every((entry) => original.includes(entry)));
  assert.equal(ordered.reduce((sum, entry) => sum + entry.waiting, 0), 4);
  assert.equal(ordered.reduce((sum, entry) => sum + entry.unanswered, 0), 7);
});

test('an empty board and a board without pending feedback keep their existing behaviour', () => {
  assert.deepEqual(prioritiseWork([]), []);
  assert.deepEqual(ids(prioritiseWork([post('new'), post('old')])), ['new', 'old']);
});
