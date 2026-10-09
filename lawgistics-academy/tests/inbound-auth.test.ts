import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAuthResults, readPostmark } from '../src/lib/work/inbound';

// Postmark's inbound payload, as the other inbound tests use it. Headers are
// in the email's own order, topmost first: the first Authentication-Results
// is the one the receiving server wrote, and any under it came with the email.
const email = (headers: Array<{ Name: string; Value: string }>, authservId = '') =>
  readPostmark(
    {
      From: 'Coach <coach@thomasphilip.com.my>',
      FromFull: { Email: 'coach@thomasphilip.com.my', Name: 'Coach' },
      MessageID: 'm1',
      Subject: 'A task',
      TextBody: 'Do this.',
      Headers: headers,
    },
    authservId,
  )!;

const AR = 'Authentication-Results';

test('DMARC passing for the sender’s own domain vouches for them', () => {
  assert.equal(
    email([{ Name: AR, Value: 'mx.inbound.example; spf=pass smtp.mailfrom=thomasphilip.com.my; dkim=pass header.d=thomasphilip.com.my; dmarc=pass (p=quarantine) header.from=thomasphilip.com.my' }]).verifiedBy,
    'dmarc',
  );
  assert.equal(
    email([{ Name: AR, Value: 'mx; dmarc=pass header.from=evil.example' }]).verifiedBy,
    null,
    'DMARC passing for some other domain says nothing about this one',
  );
  assert.equal(email([{ Name: AR, Value: 'mx; dmarc=fail header.from=thomasphilip.com.my' }]).verifiedBy, null);
});

test('a DKIM signature counts only from the sender’s own domain', () => {
  assert.equal(
    email([{ Name: AR, Value: 'mx; dkim=pass (2048-bit key) header.d=thomasphilip.com.my header.s=s1' }]).verifiedBy,
    'dkim',
  );
  assert.equal(
    email([{ Name: AR, Value: 'mx; dkim=pass header.d=evil.example' }]).verifiedBy,
    null,
    'a forger signing with their own domain does not vouch for the firm',
  );
  assert.equal(
    email([{ Name: AR, Value: 'mx; dkim=pass header.d=mail.thomasphilip.com.my.evil.example' }]).verifiedBy,
    null,
    'a domain that merely contains the firm’s is not the firm’s',
  );
  assert.equal(email([{ Name: AR, Value: 'mx; dkim=fail header.d=thomasphilip.com.my' }]).verifiedBy, null);
  assert.equal(email([]).verifiedBy, null);
});

test('forgery one: an Authentication-Results header the sender wrote is not read', () => {
  // The receiving server found nothing; the forger added their own header
  // claiming a pass, which arrives underneath the server's. Read together,
  // as they used to be, the forged pass was found and believed.
  const forged = email([
    { Name: AR, Value: 'mx.inbound.example; spf=pass smtp.mailfrom=bounce.evil.example; dkim=none; dmarc=fail header.from=thomasphilip.com.my' },
    { Name: AR, Value: 'mx.thomasphilip.com.my; dkim=pass header.d=thomasphilip.com.my; dmarc=pass header.from=thomasphilip.com.my' },
  ]);
  assert.equal(forged.verifiedBy, null);

  // A property hidden in a comment is not a property.
  assert.equal(
    email([{ Name: AR, Value: 'mx; dkim=pass (header.d=thomasphilip.com.my) header.d=evil.example' }]).verifiedBy,
    null,
  );
});

test('forgery two: SPF passing for the envelope sender lets nobody in', () => {
  // The forger sends from their own server, with their own domain as the
  // envelope sender, so SPF passes, and the firm's address in From. SPF used
  // to be enough on its own; it says nothing about the From address.
  const forged = email([
    { Name: 'Received-SPF', Value: 'Pass (sender SPF authorized) identity=mailfrom; envelope-from="x@evil.example"' },
    { Name: AR, Value: 'mx.inbound.example; spf=pass smtp.mailfrom=evil.example; dkim=none; dmarc=fail header.from=thomasphilip.com.my' },
  ]);
  assert.equal(forged.verifiedBy, null);
  assert.equal(email([{ Name: 'Received-SPF', Value: 'Pass' }]).verifiedBy, null, 'SPF with nothing else');
});

test('when the receiving server is named, a topmost header from any other is ignored', () => {
  const genuine = [{ Name: AR, Value: 'mx.inbound.example; dkim=pass header.d=thomasphilip.com.my' }];
  assert.equal(email(genuine, 'mx.inbound.example').verifiedBy, 'dkim');
  assert.equal(email(genuine, 'MX.Inbound.Example').verifiedBy, 'dkim', 'the name is not case sensitive');
  assert.equal(email(genuine, 'other.example').verifiedBy, null);
});

test('the header is read result by result', () => {
  const results = parseAuthResults('mx; dkim=pass (good) header.d=A.example header.s=x; spf=softfail smtp.mailfrom=b');
  assert.deepEqual(
    results.map((r) => [r.method, r.result, r.props.get('header.d') ?? null]),
    [
      ['dkim', 'pass', 'a.example'],
      ['spf', 'softfail', null],
    ],
  );
});
