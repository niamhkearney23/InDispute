import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPostmark } from '../src/lib/work/inbound';

const email = (headers: Array<{ Name: string; Value: string }>) =>
  readPostmark({
    From: 'Coach <coach@thomasphilip.com.my>',
    FromFull: { Email: 'coach@thomasphilip.com.my', Name: 'Coach' },
    MessageID: 'm1',
    Subject: 'A task',
    TextBody: 'Do this.',
    Headers: headers,
  })!;

test('a DKIM signature counts only from the sender’s own domain', () => {
  assert.equal(
    email([{ Name: 'Authentication-Results', Value: 'mx; dkim=pass header.d=thomasphilip.com.my' }]).dkimPass,
    true,
  );
  assert.equal(
    email([{ Name: 'Authentication-Results', Value: 'mx; dkim=pass header.d=evil.example' }]).dkimPass,
    false,
    'a forger signing with their own domain does not vouch for the firm',
  );
  assert.equal(
    email([{ Name: 'Authentication-Results', Value: 'mx; dkim=fail header.d=thomasphilip.com.my' }]).dkimPass,
    false,
  );
  assert.equal(email([]).dkimPass, false);
});

test('SPF is read as before', () => {
  assert.equal(email([{ Name: 'Received-SPF', Value: 'Pass (sender is authorised)' }]).spfPass, true);
  assert.equal(email([{ Name: 'Received-SPF', Value: 'SoftFail' }]).spfPass, false);
});
