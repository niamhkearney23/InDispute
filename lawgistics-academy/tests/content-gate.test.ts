import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test, { after, before } from 'node:test';
import ts from 'typescript';

import { forViewer, isStaff, lessonForViewer } from '../src/lib/content/gate';
import {
  REFERENCE_ITEMS,
  courtMapKey,
  courtMapWording,
  essayKey,
  essayWording,
  fingerprint,
  lessonHash,
  referenceByKey,
  referenceHash,
} from '../src/lib/content/wording';
import { ALL_LESSONS, LESSONS, lessonContent } from '../src/content/seed/lessons';
import { COURT_HIERARCHIES } from '../src/content/seed/court-hierarchies';
import { ESSAY_TOPICS } from '../src/content/seed/essay-topics';
import { MODULES } from '../src/content/seed/modules';
import { COUNTRIES } from '../src/lib/types';

/**
 * The owner's rule (0046): hide unverified lessons and legal court content
 * until a qualified lawyer approves them, in Australia and Malaysia alike.
 *
 * A learner sees a lesson, a court map or an essay topic only when a lawyer
 * has signed off its current wording. Staff still see it, labelled. These
 * tests prove it on the server: the rule itself, the server code that reads
 * the sign-offs (against a stand-in database), what the pages are allowed to
 * import, and that no browser code can carry the content to a learner.
 * The database side is in supabase/tests/schema-guarantees.sql.
 */

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

/* -------------------------------------------------------------------------- */
/* The rule                                                                    */
/* -------------------------------------------------------------------------- */

test('a learner sees an item only once it is signed off; staff see it either way, labelled', () => {
  assert.equal(forViewer('words', false, false), null);
  assert.deepEqual(forViewer('words', true, false), { item: 'words', checked: true });
  assert.deepEqual(forViewer('words', false, true), { item: 'words', checked: false });
  assert.deepEqual(forViewer('words', true, true), { item: 'words', checked: true });
  assert.equal(forViewer(null, true, true), null);
  assert.equal(forViewer(undefined, true, false), null);
});

test('staff are an administrator, a coach or a firm administrator, and nobody else', () => {
  assert.equal(isStaff({ isAdmin: true }), true);
  assert.equal(isStaff({ isCoach: true }), true);
  assert.equal(isStaff({ isFirmAdmin: true }), true);
  assert.equal(isStaff({ isAdmin: false, isCoach: false, isFirmAdmin: false }), false);
  assert.equal(isStaff(null), false);
  assert.equal(isStaff(undefined), false);
});

test('with nothing signed off, no learner in either country is given a lesson', () => {
  const withLessons = MODULES.filter((m) => LESSONS.some((l) => l.moduleSlug === m.slug));
  assert.ok(withLessons.some((m) => m.country === 'AU'), 'an Australian module has a lesson');
  assert.ok(withLessons.some((m) => m.country === 'MY'), 'a Malaysian module has a lesson');
  for (const { slug } of withLessons) {
    const learner = lessonForViewer(slug, () => false, false);
    assert.equal(learner.lesson, null, slug);
    assert.equal(learner.waiting, true, `${slug} says it is waiting`);
    const staff = lessonForViewer(slug, () => false, true);
    assert.ok(staff.lesson, `staff read ${slug}`);
    assert.equal(staff.lesson.checked, false, `${slug} is labelled unchecked for staff`);
  }
});

test('a signed-off lesson reaches learners, and only the one signed', () => {
  for (const lesson of LESSONS) {
    const shown = lessonForViewer(lesson.moduleSlug, (s) => s === lesson.slug, false);
    assert.equal(shown.lesson?.item.slug, lesson.slug);
    assert.equal(shown.lesson?.checked, true);
    assert.equal(shown.waiting, false);
  }
  // A module with no lesson at all is not "waiting".
  const none = MODULES.find((m) => !ALL_LESSONS.some((l) => l.moduleSlug === m.slug));
  if (none) assert.deepEqual(lessonForViewer(none.slug, () => true, false), { lesson: null, waiting: false });
});

/* -------------------------------------------------------------------------- */
/* What a sign-off covers                                                      */
/* -------------------------------------------------------------------------- */

test('every country has a court map to sign off, and every essay topic is listed', () => {
  for (const country of COUNTRIES) {
    const item = referenceByKey(courtMapKey(country));
    assert.ok(item, `no court map item for ${country}`);
    assert.equal(item.country, country);
    assert.equal(item.wording, courtMapWording(COURT_HIERARCHIES[country]));
  }
  for (const topic of ESSAY_TOPICS) {
    assert.equal(referenceByKey(essayKey(topic.slug))?.wording, essayWording(topic));
  }
  const keys = REFERENCE_ITEMS.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length, 'two items share a key');
  // The same shape the database insists on (content_signoffs_key_shape).
  for (const key of keys) assert.match(key, /^[a-z0-9-]{3,80}$/, key);
});

test('changing anything a learner reads on a court map needs a new sign-off', () => {
  const my = COURT_HIERARCHIES.MY;
  const before = courtMapWording(my);
  const changed = (h: typeof my) => assert.notEqual(courtMapWording(h), before);
  changed({ ...my, legend: `${my.legend} Changed.` });
  changed({ ...my, name: 'Courts' });
  changed({ ...my, tierLabels: { ...my.tierLabels, 0: 'Top' } });
  changed({ ...my, courts: my.courts.map((c, i) => (i === 0 ? { ...c, note: `${c.note}!` } : c)) });
  changed({ ...my, courts: my.courts.map((c, i) => (i === 0 ? { ...c, name: `${c.name}s` } : c)) });
  changed({
    ...my,
    courts: my.courts.map((c) =>
      c.slug === 'sessions-court' ? { ...c, appealsTo: 'court-of-appeal' } : c,
    ),
  });
  changed({ ...my, courts: my.courts.map((c) => ({ ...c, alsoAppealsTo: undefined })) });
  changed({ ...my, courts: my.courts.slice(1) });
});

test('changing an essay topic or a lesson needs a new sign-off', () => {
  const topic = ESSAY_TOPICS[0];
  assert.notEqual(essayWording({ ...topic, prompt: `${topic.prompt} Discuss.` }), essayWording(topic));
  const lesson = LESSONS[0];
  assert.equal(lessonHash(lesson), fingerprint(lessonContent(lesson)));
  const reworded = { ...lesson, title: `${lesson.title}?` };
  assert.notEqual(lessonHash(reworded), lessonHash(lesson));
  for (const item of REFERENCE_ITEMS) assert.match(referenceHash(item), /^[0-9a-f]{64}$/);
});

/* -------------------------------------------------------------------------- */
/* The server code, against a stand-in database                                */
/* -------------------------------------------------------------------------- */

interface Row {
  [key: string]: unknown;
}
const fake = {
  reference: [] as Row[],
  lessons: [] as Row[],
  fail: false,
};
let server: http.Server;

before(async () => {
  server = http.createServer((req, res) => {
    const table = (req.url ?? '').split('?')[0].replace('/rest/v1/', '');
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (fake.fail) return send(500, { message: 'down' });
    if (table === 'content_signoffs') return send(200, fake.reference);
    if (table === 'lesson_signoffs') return send(200, fake.lessons);
    if (table === 'profiles') return send(200, [{ id: REVIEWER, display_name: 'Priya', email: null }]);
    send(404, { message: 'not here' });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
});

after(() => server.close());

const REVIEWER = '44444444-4444-4444-4444-444444444444';
const signedRow = (key: string, hash: string) => ({
  content_key: key,
  content_hash: hash,
  signed_by: REVIEWER,
  signed_at: '2026-10-01T00:00:00Z',
});

// Imported after the stand-in is listening, because the settings are read
// when the module loads.
const service = () => import('../src/lib/content/service');

test('on a fresh install nothing is signed: learners get no court map, lesson or essay, staff get them labelled', async () => {
  fake.reference = [];
  fake.lessons = [];
  fake.fail = false;
  const { courtMapFor, courtMapsFor, lessonFor, essayFor } = await service();
  for (const country of COUNTRIES) {
    assert.equal(await courtMapFor(country, false), null, `${country} map reached a learner`);
    assert.equal((await courtMapFor(country, true))?.checked, false);
  }
  assert.deepEqual(await courtMapsFor(false), {});
  for (const lesson of LESSONS) {
    assert.deepEqual(await lessonFor(lesson.moduleSlug, false), { lesson: null, waiting: true });
    assert.equal((await lessonFor(lesson.moduleSlug, true)).lesson?.checked, false);
  }
  const essay = await essayFor(ESSAY_TOPICS[0].slug, false);
  assert.deepEqual(essay, { topic: null, waiting: true });
  assert.equal((await essayFor(ESSAY_TOPICS[0].slug, true)).topic?.checked, false);
  assert.deepEqual(await essayFor(null, false), { topic: null, waiting: false });
});

test('a sign-off of the current wording opens it to learners in that country only', async () => {
  const my = referenceByKey(courtMapKey('MY'))!;
  fake.reference = [signedRow(my.key, referenceHash(my))];
  fake.lessons = [];
  const { courtMapFor, courtMapsFor } = await service();
  const shown = await courtMapFor('MY', false);
  assert.equal(shown?.checked, true);
  assert.equal(shown?.item.country, 'MY');
  assert.equal(await courtMapFor('AU', false), null, 'signing Malaysia opened Australia');
  assert.deepEqual(Object.keys(await courtMapsFor(false)), ['MY']);
});

test('a sign-off of earlier wording covers nothing: changing the code withdraws it', async () => {
  const au = referenceByKey(courtMapKey('AU'))!;
  const lesson = LESSONS[0];
  fake.reference = [signedRow(au.key, fingerprint(`${au.wording} (an earlier wording)`))];
  fake.lessons = [
    {
      lesson_slug: lesson.slug,
      content_hash: fingerprint(`${lessonContent(lesson)} (an earlier wording)`),
      signed_by: REVIEWER,
      signed_at: '2026-10-01T00:00:00Z',
    },
  ];
  const { courtMapFor, lessonFor } = await service();
  assert.equal(await courtMapFor('AU', false), null);
  assert.equal((await lessonFor(lesson.moduleSlug, false)).lesson, null);

  fake.lessons = [
    { lesson_slug: lesson.slug, content_hash: lessonHash(lesson), signed_by: REVIEWER, signed_at: '2026-10-01T00:00:00Z' },
  ];
  assert.equal((await lessonFor(lesson.moduleSlug, false)).lesson?.item.slug, lesson.slug);
});

test('when the sign-offs cannot be read, nothing reaches a learner', async () => {
  const my = referenceByKey(courtMapKey('MY'))!;
  fake.reference = [signedRow(my.key, referenceHash(my))];
  fake.lessons = LESSONS.map((l) => ({
    lesson_slug: l.slug,
    content_hash: lessonHash(l),
    signed_by: REVIEWER,
    signed_at: '2026-10-01T00:00:00Z',
  }));
  fake.fail = true;
  try {
    const { courtMapFor, lessonFor, essayFor } = await service();
    assert.equal(await courtMapFor('MY', false), null);
    assert.equal((await lessonFor(LESSONS[0].moduleSlug, false)).lesson, null);
    assert.equal((await essayFor(ESSAY_TOPICS[0].slug, false)).topic, null);
  } finally {
    fake.fail = false;
  }
});

/* -------------------------------------------------------------------------- */
/* The pages                                                                   */
/* -------------------------------------------------------------------------- */

const DATA_MODULES = [
  'src/content/seed/court-hierarchies.ts',
  'src/content/seed/lessons.ts',
  'src/content/seed/essay-topics.ts',
  'src/lib/content/wording.ts',
];

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(ROOT, 'src', spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** The files a module pulls in at run time, skipping type-only imports. */
function runtimeImports(file: string): string[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  for (const statement of source.statements) {
    let spec: string | null = null;
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly) continue;
      const named = clause?.namedBindings;
      if (
        clause &&
        !clause.name &&
        named &&
        ts.isNamedImports(named) &&
        named.elements.length > 0 &&
        named.elements.every((e) => e.isTypeOnly)
      ) {
        continue;
      }
      spec = (statement.moduleSpecifier as ts.StringLiteral).text;
    } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      if (statement.isTypeOnly) continue;
      spec = (statement.moduleSpecifier as ts.StringLiteral).text;
    }
    const resolved = spec ? resolveImport(file, spec) : null;
    if (resolved) out.push(resolved);
  }
  return out;
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

test('no code that runs in the browser can carry lessons, courts or essay topics to it', () => {
  // Whatever a browser component imports is sent to every browser, shown or
  // not. The content reaches the browser only as props, from the server,
  // after the rule above. Followed through every import, not just the first.
  const data = new Set(DATA_MODULES.map((f) => path.join(ROOT, f)));
  const clientFiles = sourceFiles(path.join(ROOT, 'src')).filter((f) =>
    /^\s*['"]use client['"]/.test(fs.readFileSync(f, 'utf8')),
  );
  assert.ok(clientFiles.length > 20, `only ${clientFiles.length} browser files found`);
  const leaks: string[] = [];
  for (const start of clientFiles) {
    const seen = new Set<string>();
    const queue = [start];
    while (queue.length > 0) {
      const file = queue.shift()!;
      if (seen.has(file)) continue;
      seen.add(file);
      if (data.has(file)) {
        leaks.push(`${path.relative(ROOT, start)} -> ${path.relative(ROOT, file)}`);
        continue;
      }
      // A server action is called over the network, not bundled.
      if (file !== start && /^\s*['"]use server['"]/.test(fs.readFileSync(file, 'utf8'))) continue;
      queue.push(...runtimeImports(file));
    }
  }
  assert.deepEqual(leaks, []);
});

test('learner pages get lessons, court maps and essay topics only through the rule', () => {
  const learnerFiles = sourceFiles(path.join(ROOT, 'src/app/(app)')).concat(
    sourceFiles(path.join(ROOT, 'src/components')),
  );
  const direct = learnerFiles.filter((file) =>
    runtimeImports(file).some((imported) =>
      DATA_MODULES.map((f) => path.join(ROOT, f)).includes(imported),
    ),
  );
  assert.deepEqual(direct.map((f) => path.relative(ROOT, f)), []);
});

test('the court map page sends the map only when the rule allows, and says why when not', () => {
  const page = read('src/app/(app)/courts/page.tsx');
  assert.match(page, /const map = await courtMapFor\(profile\.country, staff\)/);
  const waiting = page.indexOf('if (!map)');
  const drawn = page.indexOf('<CourtMap hierarchy={map.item}');
  assert.ok(waiting > 0 && drawn > waiting, 'the map is drawn only after the waiting branch');
  assert.match(page, /waiting for a lawyer&rsquo;s check/);
});

test('the menu, the Learn page and the tour do not lead a learner to a court map they cannot open', () => {
  const layout = read('src/app/(app)/layout.tsx');
  assert.match(layout, /courtsShown \? \(\s*<NavLink href="\/courts"/);
  assert.match(layout, /courtMapFor\(profile\.country, isStaff\(profile\)\)/);
  const learn = read('src/app/(app)/modules/page.tsx');
  assert.match(learn, /\{courtMap \? \(\s*<Card[\s\S]*?href="\/courts"/);
  const welcome = read('src/app/(app)/welcome/page.tsx');
  assert.match(welcome, /courts: Boolean\(await courtMapFor\(profile\.country, isStaff\(profile\)\)\)/);
});

test('the module page sends a lesson, and its court diagram, only through the rule', () => {
  const page = read('src/app/(app)/modules/[slug]/page.tsx');
  assert.match(page, /lessonFor\(definition\.slug, staff\)/);
  assert.match(page, /courtMapFor\(profile\.country, staff\)/);
  assert.match(page, /lessonWaiting && entry\.total > 0/);
  assert.match(page, /waiting for a lawyer&rsquo;s check/);
  const train = read('src/app/(app)/train/[sessionId]/page.tsx');
  assert.match(train, /courtMapsFor\(await viewerIsStaff\(user\.id\)\)/);
});

test('an explanation reworded after a question was given out is not shown', () => {
  const service = read('src/lib/training/service.ts');
  assert.match(service, /const explained = version\.verification_status === 'human_verified';/);
  assert.match(service, /explanation: explained \? version\.explanation : ''/);
  assert.match(service, /if \(version\.verification_status !== 'human_verified'\) return \{ coachNote: null \};/);
});

test('loading content signs nothing off', () => {
  for (const file of ['src/lib/setup/seed-content.ts', 'scripts/seed.ts']) {
    const source = read(file);
    assert.doesNotMatch(source, /lesson_signoffs|content_signoffs/, file);
  }
});

test('signing off a court map or essay topic asks for a lawyer and pins the wording seen', () => {
  const action = read('src/app/admin/reference/actions.ts');
  const body = action.slice(action.indexOf('export async function signOffReference'));
  assert.ok(body.indexOf('checkReviewer()') < body.indexOf('recordSignOff('));
  assert.match(body, /formData\.get\('hash'\) !== referenceHash\(item\)/);
  assert.doesNotMatch(body, /checkCoach\(|checkFirmAdmin\(/);
});

test('a module page shows why the module exists to staff only', () => {
  // The rationale states law in places ("two High Courts of equal standing")
  // and has no sign-off, so it is not shown to learners. Found by the
  // integration test that searches every learner page for unsigned wording.
  const source = fs.readFileSync(path.join(ROOT, 'src/app/(app)/modules/[slug]/page.tsx'), 'utf8');
  const at = source.indexOf('definition.rationale');
  assert.ok(at > -1);
  assert.match(source.slice(Math.max(0, at - 400), at), /\{staff \? \(/, 'the rationale must sit inside {staff ? ( ... )}');
});
