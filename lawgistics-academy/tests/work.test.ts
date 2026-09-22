import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  WORK_FILE_MAX_BYTES,
  WORK_FILE_TYPES,
  isLate,
  isTrustedWorkLink,
  submissionState,
  workFileProblem,
} from '../src/lib/work/links';

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

test('an upload is a PDF, a Word document or an image, under 20MB', () => {
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
    /20MB/,
  );
});

test('every allowed type has an extension to be stored under', () => {
  for (const [type, ext] of Object.entries(WORK_FILE_TYPES)) {
    assert.match(ext, /^[a-z]+$/, `${type} has no clean extension`);
  }
});

test('the bucket accepts exactly the types the form does', () => {
  const migration = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '0019_work_board.sql'),
    'utf8',
  );
  for (const type of Object.keys(WORK_FILE_TYPES)) {
    assert.ok(migration.includes(`'${type}'`), `${type} is not in the bucket's allowed types`);
  }
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
