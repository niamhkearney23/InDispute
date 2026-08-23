/**
 * Builds a review pack: every question and daily fact, laid out to be read and
 * marked up away from a screen.
 *
 * The admin queue is the right tool if you are doing the review yourself. This
 * is for the case that actually matters: handing the content to a senior
 * practitioner who is not going to log into an admin panel, and getting their
 * corrections back. It prints cleanly to PDF from any browser.
 *
 *   npm run review:pack                 # from the live database
 *   npm run review:pack -- --from-seed  # from this repository, no database needed
 *
 * The database is the better source once you are running, because it reflects
 * what is actually there rather than what the repository says should be there.
 * The seed option exists so the content can be reviewed before any of this is
 * set up, which is the right order to do it in.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { reviewRisk, RISK_LABEL, type RiskLevel } from '../src/lib/review/triage';
import { JURISDICTION_COUNTRY, JURISDICTION_LABELS } from '../src/lib/types';
import type { Jurisdiction } from '../src/lib/types';
import { DOMAINS, FACTS, QUESTIONS } from '../src/content/seed';

config({ path: '.env.local' });
config({ path: '.env' });

const fromSeed = process.argv.includes('--from-seed');

/* Narrow the pack to one country's law.
 *
 * A reviewing practitioner is qualified in one place. Sending a Malaysian
 * advocate a pack with 122 Australian questions in it wastes their time and
 * invites the one thing a review must not produce: a tick against something
 * they were not in a position to check.
 *
 *   npm run review:pack -- --from-seed --country=MY
 */
const countryArg = (process.argv.find((a) => a.startsWith('--country=')) ?? '')
  .split('=')[1]
  ?.toUpperCase();
const country = countryArg === 'MY' || countryArg === 'AU' ? countryArg : null;
if (countryArg && !country) {
  console.error(`Unknown country "${countryArg}". Use --country=MY or --country=AU.`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!fromSeed && (!url || !serviceKey)) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'To build a pack from this repository instead, run:\n' +
      '  npm run review:pack -- --from-seed',
  );
  process.exit(1);
}

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

interface PackItem {
  ref: string;
  kind: 'Question' | 'Daily brief';
  domain: string;
  jurisdiction: Jurisdiction;
  court: string | null;
  heading: string;
  scenario: string | null;
  body: string | null;
  options: Array<{ id: string; text: string }>;
  correct: string[];
  explanation: string | null;
  whyItMatters: string | null;
  misconception: string | null;
  memoryTrick: string | null;
  source: string | null;
  sourceUrl: string | null;
  live: boolean;
  risk: { level: RiskLevel; reasons: string[]; score: number };
}

function first<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null;
}

function collectFromSeed(): PackItem[] {
  const domainName = new Map(DOMAINS.map((d) => [d.slug, d.name]));

  const items: PackItem[] = QUESTIONS.map((q) => ({
    ref: q.slug,
    kind: 'Question' as const,
    domain: domainName.get(q.domain) ?? 'Unassigned',
    jurisdiction: q.jurisdiction,
    court: q.court ?? null,
    heading: q.stem,
    scenario: q.scenario ?? null,
    body: null,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    whyItMatters: q.whyItMatters,
    misconception: q.commonMisconception ?? null,
    memoryTrick: q.memoryTrick ?? null,
    source: q.sourceReference ?? null,
    sourceUrl: q.sourceUrl ?? null,
    // Built from the repository, so there is no database to ask. This used to
    // say true for everything, which told a reviewer that 81 Malaysian items
    // were in front of learners when Malaysian content cannot publish itself
    // at all. A false alarm in a document somebody is relying on is worse than
    // no information.
    live: false,
    risk: reviewRisk({
      text: [q.stem, q.scenario, q.explanation, q.whyItMatters].filter(Boolean).join(' '),
      jurisdiction: q.jurisdiction,
      sourceReference: q.sourceReference,
      sourceUrl: q.sourceUrl,
    }),
  }));

  for (const f of FACTS) {
    items.push({
      ref: f.slug,
      kind: 'Daily brief',
      domain: f.domain ? (domainName.get(f.domain) ?? 'Unassigned') : 'Unassigned',
      jurisdiction: f.jurisdiction,
      court: f.court ?? null,
      heading: f.title,
      scenario: null,
      body: f.body,
      options: [],
      correct: [],
      explanation: null,
      whyItMatters: f.whyItMatters ?? null,
      misconception: null,
      memoryTrick: null,
      source: f.sourceReference ?? null,
      sourceUrl: f.sourceUrl ?? null,
      live: false,
      risk: reviewRisk({
        text: `${f.title} ${f.body} ${f.whyItMatters ?? ''}`,
        jurisdiction: f.jurisdiction,
        sourceReference: f.sourceReference,
        sourceUrl: f.sourceUrl,
      }),
    });
  }

  return items.sort((a, b) => {
    if (a.risk.score !== b.risk.score) return b.risk.score - a.risk.score;
    return a.ref.localeCompare(b.ref);
  });
}

async function collect(): Promise<PackItem[]> {
  if (fromSeed) return collectFromSeed();

  const db = createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: versions }, { data: facts }] = await Promise.all([
    db
      .from('question_versions')
      .select('*, questions(slug, status, domains(name))')
      .eq('is_current', true),
    db.from('daily_facts').select('*, domains(name)'),
  ]);

  const items: PackItem[] = [];

  for (const row of versions ?? []) {
    const question = first<{ slug: string; status: string; domains: unknown }>(row.questions);
    if (!question) continue;

    items.push({
      ref: question.slug,
      kind: 'Question',
      domain: first<{ name: string }>(question.domains)?.name ?? 'Unassigned',
      jurisdiction: row.jurisdiction as Jurisdiction,
      court: row.court,
      heading: row.stem as string,
      scenario: row.scenario,
      body: null,
      options: (row.options ?? []) as Array<{ id: string; text: string }>,
      correct: (row.correct_option_ids ?? []) as string[],
      explanation: row.explanation as string,
      whyItMatters: row.why_it_matters,
      misconception: row.common_misconception,
      memoryTrick: row.memory_trick,
      source: row.source_reference,
      sourceUrl: row.source_url,
      live: question.status === 'published' && row.verification_status !== 'human_verified',
      risk: reviewRisk({
        text: [row.stem, row.scenario, row.explanation, row.why_it_matters]
          .filter(Boolean)
          .join(' '),
        jurisdiction: row.jurisdiction as Jurisdiction,
        sourceReference: row.source_reference,
        sourceUrl: row.source_url,
      }),
    });
  }

  for (const row of facts ?? []) {
    items.push({
      ref: row.slug as string,
      kind: 'Daily brief',
      domain: first<{ name: string }>(row.domains)?.name ?? 'Unassigned',
      jurisdiction: row.jurisdiction as Jurisdiction,
      court: row.court,
      heading: row.title as string,
      scenario: null,
      body: row.body as string,
      options: [],
      correct: [],
      explanation: null,
      whyItMatters: row.why_it_matters,
      misconception: null,
      memoryTrick: null,
      source: row.source_reference,
      sourceUrl: row.source_url,
      live: row.status === 'published' && row.verification_status !== 'human_verified',
      risk: reviewRisk({
        text: `${row.title} ${row.body} ${row.why_it_matters ?? ''}`,
        jurisdiction: row.jurisdiction as Jurisdiction,
        sourceReference: row.source_reference,
        sourceUrl: row.source_url,
      }),
    });
  }

  return items.sort((a, b) => {
    if (a.risk.score !== b.risk.score) return b.risk.score - a.risk.score;
    return a.ref.localeCompare(b.ref);
  });
}

function renderItem(item: PackItem, index: number): string {
  const block = (label: string, value: string | null) =>
    value ? `<div class="block"><h4>${esc(label)}</h4><p>${esc(value)}</p></div>` : '';

  return `
<article class="item risk-${item.risk.level}">
  <header>
    <span class="num">${index + 1}</span>
    <span class="tags">
      <span class="tag risk">${esc(RISK_LABEL[item.risk.level])}</span>
      <span class="tag">${esc(item.kind)}</span>
      <span class="tag">${esc(item.domain)}</span>
      <span class="tag jur">${esc(JURISDICTION_LABELS[item.jurisdiction])}</span>
      ${item.live ? '<span class="tag live">Live to learners now</span>' : ''}
    </span>
    <span class="ref">${esc(item.ref)}</span>
  </header>

  ${item.scenario ? `<p class="scenario">${esc(item.scenario)}</p>` : ''}
  <h3>${esc(item.heading)}</h3>
  ${item.body ? `<p>${esc(item.body)}</p>` : ''}

  ${
    item.options.length
      ? `<ol class="options">${item.options
          .map(
            (o) =>
              `<li class="${item.correct.includes(o.id) ? 'correct' : ''}">${esc(o.text)}${
                item.correct.includes(o.id) ? ' <strong>← keyed correct</strong>' : ''
              }</li>`,
          )
          .join('')}</ol>`
      : ''
  }

  ${block('Explanation given to the learner', item.explanation)}
  ${block('Why this matters in practice', item.whyItMatters)}
  ${block('Often confused with', item.misconception)}
  ${block('Memory trick', item.memoryTrick)}

  <div class="source">
    <strong>Source:</strong>
    ${item.source ? esc(item.source) : '<span class="none">None recorded</span>'}
    ${item.court ? ` · ${esc(item.court)}` : ''}
    ${item.sourceUrl ? `<br><span class="url">${esc(item.sourceUrl)}</span>` : ''}
  </div>

  ${
    item.risk.reasons.length
      ? `<ul class="why">${item.risk.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
      : ''
  }

  <div class="decision">
    <span class="box">☐ Correct</span>
    <span class="box">☐ Needs a change</span>
    <span class="box">☐ Remove</span>
    <div class="notes"><span>Notes</span></div>
  </div>
</article>`;
}

async function main() {
  const all = await collect();
  const items = country
    ? all.filter((i) => JURISDICTION_COUNTRY[i.jurisdiction as Jurisdiction] === country)
    : all;

  if (items.length === 0) {
    console.error('No content found. Has the database been seeded?');
    process.exit(1);
  }

  const counts = {
    high: items.filter((i) => i.risk.level === 'high').length,
    medium: items.filter((i) => i.risk.level === 'medium').length,
    low: items.filter((i) => i.risk.level === 'low').length,
    live: items.filter((i) => i.live).length,
  };

  const generated = new Date().toISOString().slice(0, 10);

  const html = `<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8">
<title>Lawgistics Academy content review pack</title>
<style>
  :root { --ink:#14110f; --slate:#5c554d; --muted:#8a8177; --rule:#e2dbcd; --burgundy:#6b1f2a; }
  * { box-sizing: border-box; }
  body { font: 11pt/1.5 Georgia, 'Times New Roman', serif; color: var(--ink);
         max-width: 46em; margin: 0 auto; padding: 2.5em 1.5em 4em; }
  h1 { font-size: 1.9em; margin: 0 0 .2em; }
  h2 { font-size: 1.1em; margin: 2em 0 .5em; }
  h3 { font-size: 1.05em; margin: .5em 0; }
  h4 { font-size: .72em; text-transform: uppercase; letter-spacing: .1em;
       color: var(--muted); margin: 0 0 .25em; font-weight: 600;
       font-family: system-ui, sans-serif; }
  .lede { color: var(--slate); }
  .summary { border: 1px solid var(--rule); padding: 1em 1.2em; margin: 1.5em 0 2em; }
  .summary td { padding: .15em .8em .15em 0; }
  .item { border: 1px solid var(--rule); padding: 1.2em 1.3em; margin: 0 0 1.5em;
          page-break-inside: avoid; }
  .item.risk-high { border-left: 4px solid var(--burgundy); }
  .item.risk-medium { border-left: 4px solid #b98b3a; }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: .5em;
           margin-bottom: .8em; font-family: system-ui, sans-serif; }
  .num { font-weight: 700; font-size: 1.1em; }
  .tag { font-size: .68em; text-transform: uppercase; letter-spacing: .06em;
         border: 1px solid var(--rule); border-radius: 999px; padding: .15em .6em;
         color: var(--slate); }
  .tag.risk { border-color: var(--burgundy); color: var(--burgundy); }
  .tag.live { border-color: var(--burgundy); background: #f6ecec; color: var(--burgundy); }
  .ref { margin-left: auto; font-size: .7em; color: var(--muted);
         font-family: ui-monospace, monospace; }
  .scenario { border-left: 2px solid var(--rule); padding-left: .9em; color: var(--slate); }
  .options { margin: .6em 0; padding-left: 1.4em; }
  .options li.correct { font-weight: 700; }
  .block { margin: .7em 0; }
  .block p { margin: 0; }
  .source { margin-top: .9em; padding: .6em .8em; background: #f3efe6; font-size: .85em; }
  .source .none { color: var(--burgundy); font-weight: 700; }
  .source .url { color: var(--muted); font-size: .9em; word-break: break-all; }
  .why { margin: .7em 0 0; padding-left: 1.2em; font-size: .82em; color: var(--slate);
         font-family: system-ui, sans-serif; }
  .decision { margin-top: 1em; padding-top: .8em; border-top: 1px dashed var(--rule);
              font-family: system-ui, sans-serif; font-size: .85em; }
  .box { margin-right: 1.5em; }
  .notes { margin-top: .6em; }
  .notes span { font-size: .8em; color: var(--muted); }
  .notes::after { content: ''; display: block; border-bottom: 1px solid var(--rule);
                  height: 2.4em; }
  @media print { body { padding: 0; } .item { break-inside: avoid; } }
</style></head><body>

<h1>Content review pack</h1>
<p class="lede">Lawgistics Academy${country ? ` · ${country === 'MY' ? 'Malaysian' : 'Australian'} law only` : ''} · generated ${esc(generated)}</p>

<div class="summary">
  <p><strong>${items.length} items to review.</strong> Ordered so that the ones most
  likely to contain an error come first; those citing a specific provision, a monetary
  figure, a period, or a rule that varies by jurisdiction.</p>
  <table>
    <tr><td>Check closely</td><td><strong>${counts.high}</strong></td></tr>
    <tr><td>Worth checking</td><td><strong>${counts.medium}</strong></td></tr>
    <tr><td>Lower risk</td><td><strong>${counts.low}</strong></td></tr>
    ${
      fromSeed
        ? '<tr><td>Currently live to learners</td><td><strong>Not known</strong></td></tr>'
        : `<tr><td>Currently live to learners, unverified</td><td><strong>${counts.live}</strong></td></tr>`
    }
  </table>
  ${
    fromSeed
      ? '<p><strong>Where this came from.</strong> This pack was built from the repository rather than from a live database, so it shows what the content says and not what any installation is currently serving. Malaysian content is never published automatically in any case: it goes in front of learners only when a named person signs off each item.</p>'
      : ''
  }
  <p style="margin-bottom:0"><strong>What is being asked.</strong> For each item: is the
  proposition correct, is it correct <em>for the jurisdiction stated</em>, is the keyed
  answer right, and is the source accurate and current? Mark one box and note anything
  that needs changing. None of this content has been verified by a practitioner yet.</p>
</div>

<h2>Items</h2>
${items.map(renderItem).join('\n')}

<p style="margin-top:3em;font-size:.8em;color:#8a8177">
  Once corrections are made, re-run <code>npm run review:pack</code> for a fresh copy.
</p>
</body></html>`;

  const out = path.join(
    process.cwd(),
    country ? `review-pack-${country.toLowerCase()}.html` : 'review-pack.html',
  );
  fs.writeFileSync(out, html);

  console.log(`Wrote ${out}`);
  console.log(
    `  ${items.length} items: ${counts.high} to check closely, ${counts.medium} worth checking, ${counts.low} lower risk.`,
  );
  if (fromSeed) {
    console.log('  Built from the repository, so what any installation is serving is not known.');
  } else {
    console.log(`  ${counts.live} are live to learners without having been verified.`);
  }
  console.log('\nOpen it in a browser and print to PDF to send it on.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
