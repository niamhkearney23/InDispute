/**
 * Unsigned legal content stays off every learner-facing page, in both
 * countries, through the real website against real Supabase.
 *
 * A learner of each country (and a confirmed trainee) opens every learner
 * route, plus every page reachable by following links from them. Each page's
 * full HTML, including the data Next.js sends along for the browser, is
 * searched for any eight-word run of the legal wording nobody has signed
 * off: lessons, court maps, essay topics, questions and their explanations,
 * daily facts and matters. Then one court map is signed off, and the same
 * search finds it, which proves the search would have caught a leak.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { ALL_LESSONS, lessonContent } from '../src/content/seed/lessons';
import { COURT_HIERARCHIES } from '../src/content/seed/court-hierarchies';
import { ESSAY_TOPICS } from '../src/content/seed/essay-topics';
import { MODULES } from '../src/content/seed/modules';
import { DAY_CONCEPTS } from '../src/content/programme-concepts';
import { courtMapKey, courtMapWording, essayWording, referenceByKey, referenceHash } from '../src/lib/content/wording';
import { seedContent } from '../src/lib/setup/seed-content';
import { PASSWORD, browserOptions, person, service, type Person } from './helpers';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const WINDOW = 8;

let browser: Browser;
before(async () => {
  browser = await chromium.launch(browserOptions());
  // Everything loaded and unsigned, as on a fresh install. Loading signs
  // nothing off, so on a restored copy this only adds what is missing.
  await seedContent(service());
});
after(async () => browser?.close());

function normalise(text: string): string {
  return text
    .replace(/\\u0026|&amp;/g, '&')
    .replace(/&#x27;|&#39;|\\u0027|[‘’]/g, "'")
    .replace(/&quot;|\\"|[“”]/g, '"')
    .replace(/\\n|\\t/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Every eight-word run of a piece of text, as normalised words. */
function windows(text: string): string[] {
  const words = normalise(text).split(' ').filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i + WINDOW <= words.length; i += 4) out.push(words.slice(i, i + WINDOW).join(' '));
  return out;
}

interface Corpus {
  source: string;
  runs: string[];
}

async function unsignedCorpus(): Promise<Corpus[]> {
  const corpus: Corpus[] = [];
  for (const lesson of ALL_LESSONS) corpus.push({ source: `lesson ${lesson.slug}`, runs: windows(lessonContent(lesson)) });
  for (const [country, map] of Object.entries(COURT_HIERARCHIES)) {
    corpus.push({ source: `court map ${country}`, runs: windows(courtMapWording(map)) });
  }
  for (const topic of ESSAY_TOPICS) corpus.push({ source: `essay ${topic.slug}`, runs: windows(essayWording(topic)) });
  // The twenty rules for the sign-in pages, and the coach's notes behind them.
  for (const c of DAY_CONCEPTS) {
    corpus.push({ source: `programme rule ${c.day}`, runs: windows([c.remember, ...c.talkingPoints].join(' ')) });
  }
  // Why each module exists: it states law in places and nobody signs it off.
  for (const m of MODULES) corpus.push({ source: `module rationale ${m.slug}`, runs: windows(m.rationale) });

  const db = service();
  const { data: versions } = await db
    .from('question_versions')
    .select('question_id, stem, scenario, explanation, why_it_matters, verification_status')
    .eq('is_current', true)
    .neq('verification_status', 'human_verified');
  for (const v of versions ?? []) {
    corpus.push({
      source: `question ${v.question_id}`,
      runs: windows([v.stem, v.scenario, v.explanation, v.why_it_matters].filter(Boolean).join(' ')),
    });
  }
  const { data: facts } = await db.from('daily_facts').select('slug, title, body').neq('verification_status', 'human_verified');
  for (const f of facts ?? []) corpus.push({ source: `fact ${f.slug}`, runs: windows(`${f.title} ${f.body}`) });
  const { data: matters } = await db.from('matters').select('slug, brief, model_answer').is('verified_by', null);
  for (const m of matters ?? []) corpus.push({ source: `matter ${m.slug}`, runs: windows(`${m.brief} ${m.model_answer}`) });
  // Wording that also belongs to something signed off may rightly be on a
  // page (two court maps share a legend; a court note may repeat a
  // question's words), so it is left out of the search.
  const allowed = await signedRuns();
  return corpus
    .map((c) => ({ ...c, runs: c.runs.filter((run) => !allowed.has(run)) }))
    .filter((c) => c.runs.length > 0);
}

/** Every eight-word run of content that is signed off right now. */
async function signedRuns(): Promise<Set<string>> {
  const db = service();
  const runs = new Set<string>();
  const { data: refs } = await db.from('content_signoffs').select('content_key, content_hash');
  for (const r of refs ?? []) {
    const item = referenceByKey(r.content_key);
    if (item && referenceHash(item) === r.content_hash) for (const w of windows(item.wording)) runs.add(w);
  }
  const { data: lessons } = await db.from('lesson_signoffs').select('lesson_slug, content_hash');
  for (const l of lessons ?? []) {
    const lesson = ALL_LESSONS.find((x) => x.slug === l.lesson_slug);
    if (lesson) for (const w of windows(lessonContent(lesson))) runs.add(w);
  }
  const { data: versions } = await db
    .from('question_versions')
    .select('stem, scenario, explanation, why_it_matters')
    .eq('is_current', true)
    .eq('verification_status', 'human_verified');
  for (const v of versions ?? []) {
    for (const w of windows([v.stem, v.scenario, v.explanation, v.why_it_matters].filter(Boolean).join(' '))) runs.add(w);
  }
  const { data: facts } = await db.from('daily_facts').select('title, body').eq('verification_status', 'human_verified');
  for (const f of facts ?? []) for (const w of windows(`${f.title} ${f.body}`)) runs.add(w);
  const { data: matters } = await db.from('matters').select('brief, model_answer').not('verified_by', 'is', null);
  for (const m of matters ?? []) for (const w of windows(`${m.brief} ${m.model_answer}`)) runs.add(w);
  return runs;
}

/** A learner ready to use the academy: joined, and in MY a confirmed trainee. */
async function learner(country: 'AU' | 'MY', trainee: boolean): Promise<Person> {
  const p = await person('learner', country);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { onboarded_at: now, diagnostic_completed_at: now };
  if (trainee) Object.assign(patch, { track: 'litigation_trainee', trainee_approved_at: now });
  const { error } = await service().from('profiles').update(patch).eq('id', p.id);
  if (error) throw error;
  return p;
}

async function signedInPage(p: Person): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  return page;
}

const START_ROUTES = [
  '/dashboard', '/modules', '/skills', '/courts', '/diagnostic', '/diagnostic/compare', '/diagnostic/results',
  '/homework', '/matters', '/programme', '/programme/file', '/sessions', '/tutor', '/welcome', '/work',
  '/account', '/certificate', '/start', '/pricing',
  ...MODULES.map((m) => `/modules/${m.slug}`),
];

/** Opens every start route and every learner page they link to; returns each page's HTML. */
async function crawl(page: Page, extra: string[]): Promise<Map<string, string>> {
  const seen = new Map<string, string>();
  const queue = [...START_ROUTES, ...extra];
  while (queue.length > 0 && seen.size < 150) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    const res = await page.goto(`${APP}${path}`, { waitUntil: 'networkidle' }).catch(() => null);
    const html = res ? await res.text().catch(() => '') : '';
    const rendered = await page.content().catch(() => '');
    seen.set(path, `${html}\n${rendered}`);
    const links = await page
      .$$eval('a[href^="/"]', (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''))
      .catch(() => [] as string[]);
    for (const href of links) {
      const clean = href.split('#')[0].split('?')[0];
      if (!clean || seen.has(clean) || queue.includes(clean)) continue;
      if (/^\/(admin|api|auth|sign-out|login|signup|cartoon|_next|video)/.test(clean)) continue;
      queue.push(clean);
    }
  }
  return seen;
}

function leaks(pages: Map<string, string>, corpus: Corpus[]): string[] {
  const found: string[] = [];
  for (const [path, html] of pages) {
    const text = normalise(html);
    for (const c of corpus) {
      const hit = c.runs.find((run) => text.includes(run));
      if (hit) found.push(`${path}: ${c.source} ("${hit}")`);
    }
  }
  return found;
}

test('no unsigned legal content on any learner page, in either country', async () => {
  const corpus = await unsignedCorpus();
  assert.ok(corpus.length > 100, `only ${corpus.length} unsigned items to look for`);
  const { data: matters } = await service().from('matters').select('id');
  const matterRoutes = (matters ?? []).map((m) => `/matters/${m.id}`);

  for (const [country, trainee] of [['MY', true], ['AU', false], ['MY', false]] as const) {
    const p = await learner(country, trainee);
    const page = await signedInPage(p);
    const pages = await crawl(page, matterRoutes);
    assert.ok(pages.size >= START_ROUTES.length, `only ${pages.size} pages opened`);
    assert.deepEqual(leaks(pages, corpus), [], `unsigned legal content shown to a ${country} learner`);
    await page.context().close();
  }
});

test('nor on the public pages, signed out', async () => {
  const corpus = await unsignedCorpus();
  const context = await browser.newContext();
  const page = await context.newPage();
  const pages = new Map<string, string>();
  for (const where of ['/', '/login', '/signup', '/trainee', '/trainee/signup', '/forgot-password']) {
    const res = await page.goto(`${APP}${where}`, { waitUntil: 'networkidle' });
    pages.set(where, `${res ? await res.text() : ''}\n${await page.content()}`);
  }
  assert.deepEqual(leaks(pages, corpus), [], 'unsigned legal content on a public page');
  await context.close();
});

test('the search finds a court map once a lawyer has signed it off', async () => {
  // The control: if this did not find the signed map, the test above would
  // prove nothing.
  const coach = await person('coach');
  const item = referenceByKey(courtMapKey('MY'))!;
  const { data: already } = await service()
    .from('content_signoffs')
    .select('id')
    .eq('content_key', item.key)
    .eq('content_hash', referenceHash(item));
  if ((already ?? []).length === 0) {
    const { error } = await service()
      .from('content_signoffs')
      .insert({ content_key: item.key, content_hash: referenceHash(item), signed_by: coach.id });
    if (error) throw error;
  }

  // Only the runs that belong to one map and not the other.
  const myRuns = windows(courtMapWording(COURT_HIERARCHIES.MY));
  const auRuns = windows(courtMapWording(COURT_HIERARCHIES.AU));
  const myMap: Corpus = { source: 'court map MY', runs: myRuns.filter((r) => !auRuns.includes(r)) };
  const auMap: Corpus = { source: 'court map AU', runs: auRuns.filter((r) => !myRuns.includes(r)) };

  const my = await signedInPage(await learner('MY', false));
  const myPages = await crawl(my, []);
  assert.ok(leaks(new Map([['/courts', myPages.get('/courts') ?? '']]), [myMap]).length > 0, 'the signed map was not found');
  await my.context().close();

  const au = await signedInPage(await learner('AU', false));
  const auPages = await crawl(au, []);
  // The Australian map is still unsigned, and the Malaysian one is not for
  // an Australian learner.
  assert.deepEqual(leaks(auPages, [auMap, myMap]), [], 'a court map reached a learner it should not have');
  await au.context().close();
});
