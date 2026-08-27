/**
 * The order to review the question bank in, and how long each pile really is.
 *
 * "81 questions to verify" is a number nobody starts. It reads as one
 * undifferentiated evening, and it is not one thing at all: it is three piles
 * that need three different kinds of attention, and one of them a practising
 * lawyer can clear in a sitting without looking anything up.
 *
 * The three:
 *
 *   SIGN FROM EXPERIENCE. Questions that assert no provision. Where do you
 *   start a research task, what do you check before relying on a case, who is
 *   answerable for what a tool wrote. There is no section to cite because it is
 *   not in a section. A lawyer signs these off from practice, and that is a
 *   proper sign-off rather than a shortcut.
 *
 *   CHECK THE CITATION. Questions that name a provision. The lawyer reads the
 *   provision and confirms it says what the question says it says. Slower, but
 *   bounded, and the source list is much shorter than the question list because
 *   several questions lean on the same section.
 *
 *   FIND A CITATION FIRST. Questions that assert law and cite nothing. These
 *   cannot be signed off by anybody, however senior, because there is nothing
 *   for the next person to check. Somebody has to go and find the provision,
 *   and until they have, these are the ones holding the module shut.
 *
 * The sort is a heuristic and it is meant to be argued with. It reads the stem,
 * the explanation and the source for the marks of a legal proposition: a named
 * instrument, a section, an order, an article, a rule. It will occasionally put
 * a craft question in the wrong pile. The lawyer moves it. What it must never
 * do is put a statutory claim in the sign-from-experience pile, so anything it
 * is unsure about goes in the pile that gets more scrutiny, not less.
 *
 *   npm run plan:review            # both countries
 *   npm run plan:review -- MY      # one country
 *
 * This does not sign anything off. Sign-off happens in /admin/review, where it
 * records who decided and when.
 */

import { QUESTIONS } from '../src/content/seed';
import { JURISDICTION_COUNTRY } from '../src/lib/types';
import type { Country } from '../src/lib/types';

const arg = (process.argv[2] ?? '').toUpperCase();
const only: Country | null = arg === 'MY' || arg === 'AU' ? arg : null;

/* The marks of a legal proposition. A named instrument, or a pinpoint into
   one. Deliberately generous: a false positive costs a lawyer thirty seconds
   of reading, a false negative puts an unsourced claim in front of a paralegal
   with a signature under it. */
const INSTRUMENT = /\b(Act|Rules|Order|Constitution|Code|Regulations|Circular|Practice Direction|Ordinance|Enactment)\b/;
const PINPOINT = /(\bss?\s?\d|\bO\s?\d|\br\s?\d|\bart\s?\d|\bs\.\s?\d|\breg\s?\d|\bpara\s?\d|\bsch(edule)?\s\d)/i;

/* Naming an instrument without pinning a provision is not a citation you can
   check. "Rules of Court 2012" is a book. */
function citesAProvision(source: string | null): boolean {
  if (!source) return false;
  return PINPOINT.test(source);
}

function assertsLaw(text: string): boolean {
  return INSTRUMENT.test(text) || PINPOINT.test(text);
}

type Pile = 'experience' | 'check' | 'find';

interface Sorted {
  slug: string;
  domain: string;
  stem: string;
  source: string | null;
  pile: Pile;
  why: string;
}

const sorted: Sorted[] = [];

for (const q of QUESTIONS) {
  const country = JURISDICTION_COUNTRY[q.jurisdiction];
  if (only && country !== only) continue;

  const source = q.sourceReference ?? null;
  const body = [q.scenario ?? '', q.stem, q.explanation, q.commonMisconception ?? ''].join(' ');

  let pile: Pile;
  let why: string;

  if (citesAProvision(source)) {
    pile = 'check';
    why = 'cites a provision, read it and confirm';
  } else if (source) {
    pile = 'find';
    why = `names "${source}" but no section, order or rule`;
  } else if (assertsLaw(body)) {
    pile = 'find';
    why = 'states a rule of law with nothing to check it against';
  } else {
    pile = 'experience';
    why = 'no provision asserted, this is craft';
  }

  sorted.push({ slug: q.slug, domain: q.domain, stem: q.stem, source, pile, why });
}

const label: Record<Pile, string> = {
  experience: 'SIGN FROM EXPERIENCE',
  check: 'CHECK THE CITATION',
  find: 'FIND A CITATION FIRST',
};

const blurb: Record<Pile, string> = {
  experience:
    'No provision asserted. A practising lawyer signs these from experience,\n' +
    '  without looking anything up. This is the pile that gets a module live.',
  check:
    'A provision is cited. Read it and confirm the question says what it says.\n' +
    '  Several questions share a source, so the reading list is shorter than this.',
  find:
    'Asserts law and cites nothing checkable. Nobody can sign these off yet,\n' +
    '  however senior. Somebody has to find the provision first.',
};

console.log('');
console.log(`${sorted.length} questions${only ? `, ${only} only` : ''}.`);
console.log('');

for (const pile of ['experience', 'check', 'find'] as Pile[]) {
  const items = sorted.filter((s) => s.pile === pile);
  console.log(`${label[pile]}  (${items.length})`);
  console.log(`  ${blurb[pile]}`);
  console.log('');

  const byDomain = new Map<string, Sorted[]>();
  for (const item of items) {
    if (!byDomain.has(item.domain)) byDomain.set(item.domain, []);
    byDomain.get(item.domain)!.push(item);
  }

  for (const [domain, group] of [...byDomain.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${domain} (${group.length})`);
    for (const item of group) {
      console.log(`    ${item.slug}`);
      console.log(`      ${item.stem.slice(0, 96)}${item.stem.length > 96 ? '...' : ''}`);
      if (pile !== 'experience') console.log(`      ${item.why}`);
    }
    console.log('');
  }
  console.log('');
}

/* The distinct sources behind the check pile. This is the actual reading list,
   and it is always shorter than the question count. */
const sources = new Map<string, string[]>();
for (const item of sorted) {
  if (item.pile !== 'check' || !item.source) continue;
  if (!sources.has(item.source)) sources.set(item.source, []);
  sources.get(item.source)!.push(item.slug);
}

console.log(`THE READING LIST  (${sources.size} distinct sources behind ${
  sorted.filter((s) => s.pile === 'check').length
} questions)`);
console.log('');
for (const [source, slugs] of [...sources.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  [ ] ${source}`);
  console.log(`        ${slugs.length} question${slugs.length === 1 ? '' : 's'}: ${slugs.join(', ')}`);
}

const experience = sorted.filter((s) => s.pile === 'experience').length;
const check = sorted.filter((s) => s.pile === 'check').length;
const find = sorted.filter((s) => s.pile === 'find').length;

console.log('');
console.log('WHERE TO START');
console.log('');
console.log(`  ${experience} questions can be signed off today by a lawyer reading them,`);
console.log(`  with nothing to look up. ${check} more need ${sources.size} sources read.`);
console.log(`  ${find} are blocked until somebody finds the provision.`);
console.log('');
console.log('  Sign-off happens in /admin/review. It records who decided and when.');
console.log('');
