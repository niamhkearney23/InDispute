import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tourFinish, tourSteps } from '../src/content/tour';

const keys = (who: Parameters<typeof tourSteps>[0]) => tourSteps(who).map((s) => s.key);

test('everybody is shown each part of the menu', () => {
  const general = keys({ trainee: false, open: true, needsDiagnostic: true });
  for (const key of ['today', 'learn', 'skills', 'courts', 'account']) assert.ok(general.includes(key), key);
});

test('only trainees are told about the rounds, the work board and the month', () => {
  const general = keys({ trainee: false, open: true, needsDiagnostic: false });
  const trainee = keys({ trainee: true, open: true, needsDiagnostic: false });
  for (const key of ['rounds', 'work', 'month']) {
    assert.ok(!general.includes(key), `${key} is not for everybody`);
    assert.ok(trainee.includes(key), `${key} is for trainees`);
  }
});

test('the rounds say so when the questions are not open yet', () => {
  const closed = tourSteps({ trainee: true, open: false, needsDiagnostic: true }).find((s) => s.key === 'rounds');
  assert.match(closed!.body, /signed the questions off/);
  const open = tourSteps({ trainee: true, open: true, needsDiagnostic: true }).find((s) => s.key === 'rounds');
  assert.doesNotMatch(open!.body, /signed the questions off/);
});

test('the tour ends on the diagnostic only when there is one to sit', () => {
  assert.equal(tourFinish({ trainee: false, open: true, needsDiagnostic: true }).href, '/diagnostic');
  assert.equal(tourFinish({ trainee: false, open: true, needsDiagnostic: false }).href, '/dashboard');
  assert.equal(tourFinish({ trainee: true, open: false, needsDiagnostic: true }).href, '/dashboard');
});

test('no em or en dashes in the tour', () => {
  const all = [true, false].flatMap((trainee) =>
    tourSteps({ trainee, open: false, needsDiagnostic: true }).flatMap((s) => [s.where, s.title, s.body]),
  );
  for (const text of all) assert.doesNotMatch(text, /[–—]/);
});
