import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  WORK_FILE_MAX_BYTES,
  WORK_FILE_TYPES,
  WORK_MEMO_TYPES,
  WORK_UPLOAD_MAX_BYTES,
  uploadTooLarge,
  bareMemoType,
  describeMinutes,
  isLate,
  isTrustedWorkLink,
  slotsLabel,
  submissionState,
  workFileProblem,
  workMemoProblem,
  whoIsOn,
  initialOf,
} from '../src/lib/work/links';

const ROOT = path.join(import.meta.dirname, '..');

/**
 * The work board's rules: where a coach may link to, what may be uploaded,
 * and where a person stands on a piece of work.
 */

test('a coach may link to Google Drive or Docs over https, and nowhere else', () => {
  assert.equal(isTrustedWorkLink('https://drive.google.com/file/d/abc/view'), true);
  assert.equal(isTrustedWorkLink('https://docs.google.com/document/d/abc/edit'), true);

  assert.equal(isTrustedWorkLink('http://drive.google.com/file/d/abc/view'), false, 'not http');
  assert.equal(isTrustedWorkLink('https://drive.google.com.evil.example/x'), false);
  assert.equal(isTrustedWorkLink('https://dropbox.com/s/abc'), false);
  assert.equal(isTrustedWorkLink('javascript:alert(1)'), false);
  assert.equal(isTrustedWorkLink('not a url'), false);
  assert.equal(isTrustedWorkLink(''), false);
});

test('the link allowlist and the database constraint agree', () => {
  // The same two hosts, in the migration's own words. If one side changes,
  // the other must change with it.
  const migration = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '0019_work_board.sql'),
    'utf8',
  );
  assert.match(migration, /link_url ~ '\^https:\/\/\(drive\|docs\)\\\.google\\\.com\/'/);
});

test('an upload is a PDF, a Word document or an image, under 4MB', () => {
  assert.equal(workFileProblem({ type: 'application/pdf', size: 1024 }), null);
  assert.equal(
    workFileProblem({
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024,
    }),
    null,
  );
  assert.equal(workFileProblem({ type: 'image/png', size: 1024 }), null);

  assert.match(workFileProblem({ type: 'application/pdf', size: 0 }) ?? '', /Choose a file/);
  assert.match(workFileProblem({ type: 'text/html', size: 10 }) ?? '', /PDF/);
  assert.match(
    workFileProblem({ type: 'application/pdf', size: WORK_FILE_MAX_BYTES + 1 }) ?? '',
    /4MB/,
  );
});

test('what one form sends has to fit through the host in one request', () => {
  // Vercel refuses a request over about 4.5MB with a blank page, so the forms
  // check the total before sending, file and memo together.
  assert.equal(uploadTooLarge([WORK_FILE_MAX_BYTES]), null);
  assert.equal(uploadTooLarge([0, 0]), null);
  assert.ok(WORK_UPLOAD_MAX_BYTES < 4.5 * 1024 * 1024);
  assert.match(uploadTooLarge([WORK_UPLOAD_MAX_BYTES + 1]) ?? '', /4MB/);
  assert.match(
    uploadTooLarge([WORK_FILE_MAX_BYTES, 1024 * 1024]) ?? '',
    /file and the voice memo together/,
  );
});

test('every allowed type has an extension to be stored under', () => {
  for (const [type, ext] of Object.entries(WORK_FILE_TYPES)) {
    assert.match(ext, /^[a-z]+$/, `${type} has no clean extension`);
  }
});

test('the bucket accepts exactly the types the forms do', () => {
  // 0020 restates the bucket's allowed types in full, so it is the one
  // that has to agree with both the document and the memo lists.
  const migration = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '0020_work_memos_messages_slots.sql'),
    'utf8',
  );
  for (const type of [...Object.keys(WORK_FILE_TYPES), ...Object.keys(WORK_MEMO_TYPES)]) {
    assert.ok(migration.includes(`'${type}'`), `${type} is not in the bucket's allowed types`);
  }
});

test('a recording is checked by its bare type, codec suffix and all', () => {
  assert.equal(bareMemoType('audio/webm;codecs=opus'), 'audio/webm');
  assert.equal(bareMemoType('AUDIO/MP4'), 'audio/mp4');
  assert.equal(workMemoProblem({ type: 'audio/webm;codecs=opus', size: 2048 }), null);
  assert.match(workMemoProblem({ type: 'video/mp4', size: 2048 }) ?? '', /cannot be played/);
  assert.match(workMemoProblem({ type: 'audio/webm', size: 0 }) ?? '', /empty/);
  assert.match(
    workMemoProblem({ type: 'audio/webm', size: WORK_FILE_MAX_BYTES + 1 }) ?? '',
    /4MB/,
  );
});

test('how many may take it, and how long it takes, read as plain sentences', () => {
  assert.equal(slotsLabel(null), 'For everyone');
  assert.equal(slotsLabel(1), 'For one person');
  assert.equal(slotsLabel(3), 'For 3 people');

  assert.equal(describeMinutes(1), 'about 1 minute');
  assert.equal(describeMinutes(45), 'about 45 minutes');
  assert.equal(describeMinutes(60), 'about 1 hour');
  assert.equal(describeMinutes(90), 'about 1.5 hours');
  assert.equal(describeMinutes(480), 'about 1 day');
  assert.equal(describeMinutes(720), 'about 1.5 days');
});

test('where a person stands follows their latest submission', () => {
  assert.equal(submissionState(null), 'none');
  assert.equal(submissionState({ verdict: null }), 'waiting');
  assert.equal(submissionState({ verdict: 'good' }), 'good');
  assert.equal(submissionState({ verdict: 'again' }), 'again');
});

test('late is strictly after the due date, and never without one', () => {
  assert.equal(isLate('2026-09-20', '2026-09-21'), true);
  assert.equal(isLate('2026-09-21', '2026-09-21'), false);
  assert.equal(isLate('2026-09-22', '2026-09-21'), false);
  assert.equal(isLate(null, '2026-09-21'), false);
});

test('who is on a post reads naturally, reader first, and fits on a phone', () => {
  const me = { firstName: 'Aisyah', isMe: true };
  const wei = { firstName: 'Wei', isMe: false };
  const hafiz = { firstName: 'Hafiz', isMe: false };
  const priya = { firstName: 'Priya', isMe: false };
  const sam = { firstName: 'Sam', isMe: false };
  assert.equal(whoIsOn([]), 'Nobody on this yet. Be the first.');
  assert.equal(whoIsOn([me]), 'You are on this');
  assert.equal(whoIsOn([wei]), 'Wei is on this');
  assert.equal(whoIsOn([wei, me]), 'You and Wei are on this');
  assert.equal(whoIsOn([wei, hafiz, me]), 'You, Wei and Hafiz are on this');
  assert.equal(whoIsOn([wei, hafiz, priya, sam]), 'Wei, Hafiz, Priya and 1 other are on this');
  assert.equal(whoIsOn([me, wei, hafiz, priya, sam]), 'You, Wei, Hafiz and 2 others are on this');
});

test('a bubble shows a first letter, and a question mark for somebody unnamed', () => {
  assert.equal(initialOf('wei'), 'W');
  assert.equal(initialOf('Someone'), '?');
  assert.equal(initialOf(''), '?');
});

test('comments have no edit or delete anywhere, and their author is the session', () => {
  const sql = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/0026_trainee_videos_and_comments.sql'),
    'utf8',
  );
  assert.doesNotMatch(sql, /on public\.work_comments\s+for (update|delete|all)/);
  const actions = fs.readFileSync(path.join(ROOT, 'src/app/(app)/actions.ts'), 'utf8');
  const body = actions.slice(actions.indexOf('export async function postComment'));
  assert.match(body, /author_id: user\.id/);
  assert.doesNotMatch(body, /createServiceClient/);
});
