import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_SCHEDULE, type Schedule } from '../src/lib/training/schedule';
import { todayIn } from '../src/lib/onboarding/rules';
import {
  REMINDER_LEAD_MINUTES,
  deviceLabel,
  isPushServiceAddress,
  markedMessage,
  newWorkMessage,
  readSubscription,
  roundDueForReminder,
  roundReminder,
} from '../src/lib/push/rules';

/**
 * The academy on a phone (0042): installable from the browser, and able to
 * send a notification before a round, when work is marked and when new work
 * goes up.
 *
 * The reminder rule matters most. It must never announce a round the Today
 * page would not show, so it is built from the rounds' own functions and
 * checked here against the same placement, weekends and holidays.
 */

const ROOT = path.join(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

// A placement in November 2026 on the default clock: Kuala Lumpur, rounds at
// 7, 8, 9 and 10am, Deepavali on Monday 9 November skipped. Kuala Lumpur is
// eight hours ahead of UTC, so 8am there is midnight UTC.
const STARTS = '2026-11-02';
const ENDS = '2026-11-30';

function dueAt(
  iso: string,
  schedule: Schedule = DEFAULT_SCHEDULE,
  starts: string | null = STARTS,
  ends: string | null = ENDS,
) {
  const now = new Date(iso);
  return roundDueForReminder(schedule, todayIn(schedule.timezone, now), starts, ends, now);
}

test('a round is due a reminder in the ten minutes before it opens', () => {
  assert.equal(REMINDER_LEAD_MINUTES, 10);

  // 7:52 on Tuesday 3 November: the 8am round, the second of four.
  const due = dueAt('2026-11-02T23:52:00Z');
  assert.ok(due, 'eight minutes before a round is inside the lead');
  assert.equal(due.number, 2);
  assert.equal(due.opensLabel, '8am');
  assert.equal(due.opensAt.toISOString(), '2026-11-03T00:00:00.000Z');

  // 6:51 is nine minutes before the first round.
  assert.equal(dueAt('2026-11-02T22:51:00Z')?.number, 1);
});

test('no reminder too early, once a round has opened, or after the morning', () => {
  assert.equal(dueAt('2026-11-02T23:45:00Z'), null, 'fifteen minutes ahead is too early');
  assert.equal(dueAt('2026-11-03T00:00:00Z'), null, 'at 8am the round is open, not about to');
  assert.equal(dueAt('2026-11-03T00:05:00Z'), null, 'during a round nothing is about to open for 55 minutes');
  assert.equal(dueAt('2026-11-03T03:30:00Z'), null, '11:30am is after the last round');
});

test('no reminder on a weekend, a skipped holiday, or outside the placement', () => {
  // 6:55am Kuala Lumpur on each day.
  assert.equal(dueAt('2026-11-06T22:55:00Z'), null, 'Saturday 7 November');
  assert.equal(dueAt('2026-11-08T22:55:00Z'), null, 'Monday 9 November is Deepavali');
  assert.ok(dueAt('2026-11-09T22:55:00Z'), 'Tuesday 10 November is a rounds day');
  assert.ok(dueAt('2026-11-01T22:55:00Z'), 'Monday 2 November is day one');
  assert.equal(dueAt('2026-11-02T22:55:00Z', DEFAULT_SCHEDULE, '2026-11-04'), null, 'before the start date');
  assert.ok(dueAt('2026-11-29T22:55:00Z'), 'Monday 30 November is the last day');
  assert.equal(dueAt('2026-11-30T22:55:00Z'), null, '1 December is after the end date');
  assert.equal(dueAt('2026-11-02T22:55:00Z', DEFAULT_SCHEDULE, null, null), null, 'no start date, no rounds');
});

test('a cohort on its own clock is reminded on its own hours', () => {
  // Sydney, rounds at 9am and 1pm. Sydney is eleven hours ahead of UTC in
  // November (daylight saving), so 12:52pm there is 1:52am UTC.
  const sydney: Schedule = { timezone: 'Australia/Sydney', roundHours: [9, 13], holidays: {} };
  const due = dueAt('2026-11-03T01:52:00Z', sydney);
  assert.ok(due);
  assert.equal(due.number, 2);
  assert.equal(due.opensLabel, '1pm');
  assert.equal(dueAt('2026-11-02T21:52:00Z', sydney)?.opensLabel, '9am', '8:52am in Sydney');
  // 7:52am in Kuala Lumpur is 10:52am in Sydney: nothing for this cohort.
  assert.equal(dueAt('2026-11-02T23:52:00Z', sydney), null);
});

test('what the notifications say', () => {
  const due = dueAt('2026-11-02T23:52:00Z');
  assert.ok(due);
  const reminder = roundReminder(due, DEFAULT_SCHEDULE);
  assert.equal(reminder.title, 'Round 2 of four opens at 8am');
  assert.equal(reminder.body, 'Kuala Lumpur time. Ten questions, and the round is open for the hour.');
  assert.equal(reminder.url, '/dashboard');

  const one: Schedule = { ...DEFAULT_SCHEDULE, roundHours: [9] };
  const single = roundDueForReminder(one, '2026-11-03', STARTS, ENDS, new Date('2026-11-03T00:55:00Z'));
  assert.ok(single);
  assert.equal(roundReminder(single, one).title, 'Round 1 opens at 9am', 'no "of one"');

  const post = { id: '0b8a5d1e-1111-4222-8333-944444444444', title: 'Draft a letter of demand', kind: 'task' as const };
  assert.equal(markedMessage(post).title, 'Your work has been marked');
  assert.equal(markedMessage(post).url, `/work/${post.id}`);
  assert.equal(newWorkMessage(post).title, 'New work on the board');
  assert.equal(newWorkMessage({ ...post, kind: 'material' }).title, 'Something new to read');

  const long = newWorkMessage({ ...post, title: 'x'.repeat(200) });
  assert.ok(long.body.length <= 90, 'a lock screen shows about a line');

  // A tag per thing, so a second mark on the same post replaces the first.
  assert.equal(markedMessage(post).tag, markedMessage(post).tag);
  assert.notEqual(markedMessage(post).tag, newWorkMessage(post).tag);
});

test('the server only ever sends to a real push service', () => {
  // The server makes a request to whatever address a browser hands it, so an
  // address anywhere else would let somebody point this server at a URL of
  // their choosing.
  for (const ok of [
    'https://fcm.googleapis.com/fcm/send/abc123',
    'https://web.push.apple.com/QGdY8x',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAA',
    'https://wns2-par02p.notify.windows.com/w/?token=BQYAAA',
  ]) {
    assert.equal(isPushServiceAddress(ok), true, ok);
  }
  for (const bad of [
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://fcm.googleapis.com.evil.example/x',
    'https://evil.example/fcm.googleapis.com',
    'https://user:pass@fcm.googleapis.com/x',
    'https://fcm.googleapis.com:8443/x',
    'https://169.254.169.254/latest/meta-data',
    'https://localhost/x',
    'https://notify.windows.com.evil.example/',
    'javascript:alert(1)',
    'not a url',
  ]) {
    assert.equal(isPushServiceAddress(bad), false, bad);
  }
});

test('a subscription is checked before it is saved', () => {
  const p256dh = 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM';
  const auth = 'tBHItJI5svbpez7KI4CCXg';
  const good = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', keys: { p256dh, auth } };
  assert.deepEqual(readSubscription(JSON.stringify(good)), { endpoint: good.endpoint, p256dh, auth });

  assert.equal(readSubscription('{'), null, 'not JSON');
  assert.equal(readSubscription(JSON.stringify({ ...good, endpoint: 'https://evil.example/x' })), null);
  assert.equal(readSubscription(JSON.stringify({ ...good, keys: { p256dh, auth: 'short' } })), null);
  assert.equal(readSubscription(JSON.stringify({ ...good, keys: { p256dh: 'not base64!', auth } })), null);
  assert.equal(readSubscription(JSON.stringify({ endpoint: good.endpoint })), null, 'no keys');
  assert.equal(readSubscription('x'.repeat(5000)), null, 'too long to be one');
});

test('a device is labelled plainly and nothing more specific is kept', () => {
  assert.equal(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)'), 'iPhone');
  assert.equal(deviceLabel('Mozilla/5.0 (Linux; Android 14; SM-S921B) Mobile Safari/537.36'), 'Android phone');
  assert.equal(deviceLabel('Mozilla/5.0 (Linux; Android 14; SM-X710) Safari/537.36'), 'Android tablet');
  assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'Computer');
  assert.equal(deviceLabel(null), 'Computer');
});

test('what a phone needs to install the academy is reachable without signing in', () => {
  // A browser fetches the manifest without the sign-in cookie. Gated, it gets
  // the login page instead and installing quietly fails.
  const source = read('src/middleware.ts');
  const match = /matcher:\s*\[\s*'([^']+)'/.exec(source);
  assert.ok(match);
  const matcher = new RegExp(`^${match[1].replace(/\\\\/g, '\\')}$`);

  for (const open of ['/manifest.webmanifest', '/sw.js', '/offline.html', '/apple-icon', '/app-icon/192', '/app-icon/maskable']) {
    assert.equal(matcher.test(open), false, `${open} must not be gated`);
  }
  for (const gated of ['/dashboard', '/account', '/sw.jsx', '/offline', '/app-iconic', '/work/abc']) {
    assert.equal(matcher.test(gated), true, `${gated} must still be gated`);
  }
});

test('the reminder route is off unless switched on, and checks its own secret', () => {
  const code = stripComments(read('src/app/api/push/rounds/route.ts'));
  assert.match(code, /expected\.length < 24 \|\| !pushConfigured\(\)/);
  assert.match(code, /return new NextResponse\('Not found', \{ status: 404 \}\)/);
  assert.match(code, /timingSafeEqual\(a, b\)/);
  assert.match(code, /if \(a\.length !== b\.length\) return false;/);
  assert.ok(!/presented === expected|expected === presented/.test(code));

  // Listed by itself, never by opening up the whole of /api.
  const middleware = read('src/middleware.ts');
  assert.match(middleware, /'\/api\/push\/rounds',/);
  assert.ok(!/PUBLIC_PATHS = \[[^\]]*'\/api'[,\]]/.test(middleware));
});

test('the service worker keeps nothing but its offline page', () => {
  // Every other page holds somebody's own record. A phone that cached them
  // would show yesterday's rounds, or one person's page to the next.
  const sw = stripComments(read('public/sw.js'));
  assert.equal((sw.match(/cache\.add\(/g) ?? []).length, 1, 'one page is stored');
  assert.match(sw, /const OFFLINE = '\/offline\.html'/);
  assert.ok(!/cache\.put\(|cache\.addAll\(/.test(sw), 'nothing else is ever stored');
  assert.match(sw, /if \(event\.request\.mode !== 'navigate'\) return;/, 'only pages, and only when offline');
  // A notification only ever opens a page of this app. Read from the raw
  // file: stripping comments would also eat the '//' inside this string.
  assert.match(read('public/sw.js'), /url\.startsWith\('\/'\) && !url\.startsWith\('\/\/'\)/);
});

test('the offline page names no brand and carries no em dash', () => {
  const page = read('public/offline.html');
  assert.ok(!/Lawgistics|Thomas Philip/.test(page), 'it is the same on every firm’s copy');
  assert.ok(!page.includes(String.fromCharCode(0x2014)));
});

test('devices are read by their owner only and written by the server only', () => {
  const sql = read('supabase/migrations/0042_phone_notifications.sql').replace(/--.*$/gm, '');
  assert.match(sql, /alter table public\.push_devices enable row level security;/);
  assert.match(sql, /alter table public\.push_round_reminders enable row level security;/);
  assert.match(sql, /for select to authenticated using \(user_id = auth\.uid\(\)\)/);
  assert.match(sql, /revoke insert, update, delete, truncate on public\.push_devices from anon, authenticated;/);
  assert.match(sql, /revoke all on public\.push_round_reminders from anon, authenticated;/);
  assert.equal((sql.match(/create policy/g) ?? []).length, 1, 'one policy: reading your own devices');
  assert.match(sql, /references auth\.users \(id\) on delete cascade/, 'a device goes with its account');

  // Who hears about new work is the board's own rule, not a second copy.
  assert.match(sql, /select public\.work_visible_to\(post, auth\.uid\(\)\);/);
  assert.match(sql, /and public\.work_visible_to\(w, d\.user_id\)/);
  for (const fn of ['work_visible_to(public.work_posts, uuid)', 'push_devices_for_work_post(uuid)']) {
    assert.ok(sql.includes(`revoke all on function public.${fn} from anon, authenticated;`), fn);
    assert.ok(sql.includes(`grant execute on function public.${fn} to service_role;`), fn);
  }
});

test('new work is announced once, and marking or posting never waits on a phone', () => {
  const service = stripComments(read('src/lib/push/service.ts'));
  assert.match(service, /\.is\('announced_at', null\)/, 'claimed for announcing only if it has not been');
  assert.match(service, /onConflict: 'user_id,opens_at', ignoreDuplicates: true/, 'a reminder is noted once');

  const actions = stripComments(read('src/app/admin/work/actions.ts'));
  assert.match(actions, /after\(\(\) => notifyNewWorkPost\(id\)\)/);
  assert.match(actions, /after\(\(\) => notifyMarked\(submissionId\)\)/);
  assert.ok(
    actions.indexOf('notifyMarked(submissionId)') > actions.indexOf(".update({\n      verdict"),
    'told only once the mark is saved',
  );
});
