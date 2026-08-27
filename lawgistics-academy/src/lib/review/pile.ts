/**
 * Which kind of attention an item needs, so a queue of hundreds becomes three
 * lists somebody can actually start.
 *
 * "233 items to verify" is a number nobody starts. It reads as one
 * undifferentiated evening, and it is not one thing at all. It is three piles
 * wanting three different kinds of work, and one of them a practising lawyer
 * can clear in a sitting without looking anything up.
 *
 *   SIGN_FROM_EXPERIENCE. Asserts no provision. Where you start a research
 *   task, what "binding" means, who is answerable for what a tool wrote. There
 *   is no section to cite because it is not in a section. A lawyer signs these
 *   from practice, and that is a proper sign-off rather than a shortcut.
 *
 *   CHECK_THE_CITATION. Names a provision. Read it, confirm the item says what
 *   it says. Slower, but bounded, and the reading list is shorter than the item
 *   list because several items lean on the same section.
 *
 *   FIND_A_CITATION. Asserts law and cites nothing checkable. These cannot be
 *   signed off by anybody, however senior, because there is nothing for the
 *   next person to check. Somebody has to go and find the provision first.
 *
 * It is a heuristic and it is meant to be argued with. It looks for the marks
 * of a legal proposition: a named instrument, or a pinpoint into one. It will
 * occasionally put a craft item in the wrong pile, and the lawyer moves it.
 *
 * What it must never do is put a statutory claim in the sign-from-experience
 * pile, because that pile is the one somebody works through quickly and on
 * trust. So the patterns are deliberately generous and anything uncertain lands
 * where it gets more scrutiny, not less. When changing them, only ever make
 * them catch more.
 */

export type Pile = 'sign_from_experience' | 'check_the_citation' | 'find_a_citation';

export const PILE_ORDER: Pile[] = [
  'sign_from_experience',
  'check_the_citation',
  'find_a_citation',
];

export const PILE_LABEL: Record<Pile, string> = {
  sign_from_experience: 'Sign from experience',
  check_the_citation: 'Check the citation',
  find_a_citation: 'Find a citation first',
};

export const PILE_BLURB: Record<Pile, string> = {
  sign_from_experience:
    'These assert no provision, so there is nothing to look up. Read each one and ' +
    'sign it from practice. This is the pile that gets a module live.',
  check_the_citation:
    'Each of these names a provision. Read the provision and confirm the item says ' +
    'what it says. Several share a source, so the reading is shorter than the list.',
  find_a_citation:
    'These state a rule of law and cite nothing anybody could check. They cannot be ' +
    'signed off yet, however senior you are. Somebody has to find the provision first.',
};

/** A named instrument. */
const INSTRUMENT =
  /\b(Act|Rules|Order|Constitution|Code|Regulations|Circular|Practice Direction|Practice Note|Ordinance|Enactment)\b/;

/**
 * A pinpoint into one: a section, order, rule, article, regulation, schedule.
 *
 * Both how a citation writes it and how a sentence writes it. A question whose
 * explanation says "Article 121(1A) removes the jurisdiction" is making exactly
 * the same unsourced statutory claim as one that says "art 121(1A)", and an
 * earlier version of this caught only the second. It was found by a test
 * written to assert the thing this must never do, which is why that test is
 * worth more than the ones checking it gets the easy cases right.
 */
const PINPOINT = new RegExp(
  [
    '\\bss?\\s?\\d', // s 96, ss 27
    '\\bs\\.\\s?\\d', // s. 96
    '\\bO\\s?\\d', // O 14
    '\\br\\s?\\d', // r 19
    '\\bart\\s?\\d', // art 121
    '\\breg\\s?\\d', // reg 5
    '\\bpara\\s?\\d', // para 3
    '\\bsch(edule)?\\s\\d', // sch 9
    // Spelled out, but not when the number that follows is the year in the
    // instrument's own name. "Legal Profession (Practice and Etiquette) Rules
    // 1978" names a book; "Order 53" is a place in one.
    '\\b(section|article|order|rule|regulation|paragraph|schedule|clause)s?\\s+(?!(?:1[89]|20)\\d{2}\\b)\\d',
  ].join('|'),
  'i',
);

/**
 * Naming an instrument without pinning a provision is not a citation anybody
 * can check. "Rules of Court 2012" is a book.
 */
export function citesAProvision(source: string | null | undefined): boolean {
  return Boolean(source) && PINPOINT.test(String(source));
}

export function assertsLaw(text: string): boolean {
  return INSTRUMENT.test(text) || PINPOINT.test(text);
}

export interface Classifiable {
  sourceReference: string | null | undefined;
  /** Everything the reader sees: stem or title, scenario, explanation, misconception. */
  text: string;
}

export function classifyPile(item: Classifiable): Pile {
  if (citesAProvision(item.sourceReference)) return 'check_the_citation';
  if (item.sourceReference) return 'find_a_citation';
  return assertsLaw(item.text) ? 'find_a_citation' : 'sign_from_experience';
}

/** Why it landed where it did, in words somebody can disagree with. */
export function pileReason(item: Classifiable): string {
  if (citesAProvision(item.sourceReference)) return 'cites a provision, read it and confirm';
  if (item.sourceReference) {
    return `names "${item.sourceReference}" but no section, order or rule`;
  }
  return assertsLaw(item.text)
    ? 'states a rule of law with nothing to check it against'
    : 'no provision asserted, this is craft';
}

/** Parses a pile out of a query string, falling back to no filter. */
export function asPile(value: string | undefined): Pile | null {
  if (!value) return null;
  return (PILE_ORDER as string[]).includes(value) ? (value as Pile) : null;
}
