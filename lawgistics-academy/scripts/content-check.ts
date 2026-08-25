/**
 * Content audit: the classes of error a lawyer found by hand, looked for
 * everywhere else.
 *
 * The first Malaysian review turned up six problems. None was a typo, and all
 * six were the same handful of shapes:
 *
 *   1. a question broader than its own keyed answer, because the provision has
 *      a second limb (Federal Court leave, s 96(a) against s 96(b));
 *   2. a right answer under a wrong citation (Sessions Court appeals under
 *      s 26, which is criminal, rather than ss 27 to 28);
 *   3. a rule stated for the whole country when it varies inside it
 *      (fourteen days to enter appearance, which is Peninsular Malaysia);
 *   4. claims about how AI systems are built, which date;
 *   5. explanations more absolute than the law is ("does not belong in the
 *      civil courts at all");
 *   6. a stem whose framing fights its own explanation.
 *
 * Shapes repeat. This finds every other place they could be hiding, so the
 * source-by-source pass is a short list rather than a hunt.
 *
 * It cannot tell you whether the law is right. Nothing can, except a lawyer
 * reading it. What it can do is make sure nobody is asked to check a claim that
 * cites nothing, and that the same six mistakes are not sitting in the
 * seventy-five questions nobody has read yet.
 *
 *   npm run check:content            # everything
 *   npm run check:content -- MY      # one country
 *
 * Exits non-zero if anything is flagged, so it can gate a publish.
 */

import { QUESTIONS } from '../src/content/seed';
import { FACTS } from '../src/content/seed/facts';
import { JURISDICTION_COUNTRY } from '../src/lib/types';
import type { Country } from '../src/lib/types';

const arg = (process.argv[2] ?? '').toUpperCase();
const only: Country | null = arg === 'MY' || arg === 'AU' ? arg : null;

interface Flag {
  ref: string;
  kind: string;
  detail: string;
}

const flags: Flag[] = [];

/* Language more absolute than law usually is. Each of these was in the
   reviewer's list or is the same shape as something that was. Matched as whole
   words so "not at all" is caught and "install" is not. */
const ABSOLUTES = [
  '(?<!almost )\\balways\\b',
  '(?<!almost )\\bnever\\b',
  '\\buseless\\b',
  '\\bimpossible\\b',
  '\\bno exception',
  '\\bevery case\\b',
  '\\bin all cases\\b',
  '\\bdoes not .{0,40} at all\\b',
  '\\bcannot .{0,40} at all\\b',
];

/* Claims about how a model is built or what it will do. These date, and the
   reviewer struck three of them. */
const MODEL_CLAIMS = [
  'cutoff',
  'cut-off',
  'training data',
  'trained on',
  'trained overwhelmingly',
  'it will confirm',
  'knowledge has a',
];

/* A rule stated for a whole country that may vary inside it. Malaysia is the
   live case: the Rules of Court run differently in Sabah and Sarawak, and the
   subordinate courts differ again. */
const COUNTRYWIDE = ['within malaysia', 'in malaysia,', 'anywhere in malaysia', 'throughout malaysia'];

/* A source that names an instrument but no provision inside it. Fine for a
   principle, unhelpful for anybody asked to check a specific proposition. */
function citesNoProvision(source: string): boolean {
  return !/\b(s|ss|section|sections|art|article|o|order|r|rule|para|paragraph|sch|schedule)\b\.?\s*\d/i.test(
    source,
  );
}

const questions = QUESTIONS.filter(
  (q) => !only || JURISDICTION_COUNTRY[q.jurisdiction] === only,
);
const facts = FACTS.filter((f) => !only || JURISDICTION_COUNTRY[f.jurisdiction] === only);

for (const q of questions) {
  const prose = [q.stem, q.scenario, q.explanation, q.whyItMatters, q.commonMisconception]
    .filter(Boolean)
    .join(' ');
  /* Absolutes are only checked where law is stated. The commentary fields are
     about clients and habits, and "clients almost always want the pleading to
     tell the whole story" is not an overstatement of anything. Scanning them
     produced a list long enough to be ignored, which is the same as no list. */
  const stated = [q.stem, q.explanation].filter(Boolean).join(' ');
  const ref = `${q.slug} [${q.jurisdiction}]`;

  if (!q.sourceReference) {
    flags.push({
      ref,
      kind: 'no-source',
      detail: 'States a proposition with nothing to check it against.',
    });
  } else if (citesNoProvision(q.sourceReference)) {
    flags.push({
      ref,
      kind: 'source-has-no-provision',
      detail: `"${q.sourceReference}" names an instrument but no section, order or rule.`,
    });
  }

  for (const pattern of ABSOLUTES) {
    const hit = stated.match(new RegExp(`[^.]*${pattern}[^.]*\\.`, 'i'));
    if (hit) {
      flags.push({ ref, kind: 'absolute-language', detail: hit[0].trim().slice(0, 150) });
      break;
    }
  }

  for (const claim of MODEL_CLAIMS) {
    if (prose.toLowerCase().includes(claim)) {
      flags.push({ ref, kind: 'claim-about-the-model', detail: `mentions "${claim}"` });
      break;
    }
  }

  for (const phrase of COUNTRYWIDE) {
    if (prose.toLowerCase().includes(phrase)) {
      flags.push({
        ref,
        kind: 'stated-countrywide',
        detail: `"${phrase}": check the rule does not vary by State or Division.`,
      });
      break;
    }
  }
}

for (const f of facts) {
  if (!f.sourceReference) {
    flags.push({
      ref: `${f.slug} [${f.jurisdiction}] (daily brief)`,
      kind: 'no-source',
      detail: 'States a proposition with nothing to check it against.',
    });
  }
}

/* The checklist. Deduplicated, because 81 questions cite far fewer than 81
   distinct provisions and checking one twice is wasted lawyer time. */
const bySource = new Map<string, string[]>();
for (const q of questions) {
  if (!q.sourceReference) continue;
  const list = bySource.get(q.sourceReference) ?? [];
  list.push(q.slug);
  bySource.set(q.sourceReference, list);
}

const label = only ? `${only} ` : '';
console.log(`\n${questions.length} ${label}questions and ${facts.length} daily briefs.\n`);

console.log(`SOURCES TO VERIFY: ${bySource.size} distinct, covering ${
  questions.filter((q) => q.sourceReference).length
} questions.\n`);
for (const [source, slugs] of [...bySource].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  [ ] ${source}`);
  console.log(`        ${slugs.length} question${slugs.length === 1 ? '' : 's'}: ${slugs.join(', ')}`);
}

const byKind = new Map<string, Flag[]>();
for (const f of flags) byKind.set(f.kind, (byKind.get(f.kind) ?? []).concat(f));

console.log(`\nFLAGGED: ${flags.length}\n`);
for (const [kind, list] of [...byKind].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${kind} (${list.length})`);
  for (const f of list) {
    console.log(`  ${f.ref}`);
    console.log(`    ${f.detail}`);
  }
  console.log('');
}

console.log(
  'None of this says the law is wrong. It says where a lawyer should look, and\n' +
    'where nobody could check even if they wanted to.',
);

process.exit(flags.length > 0 ? 1 : 0);
