/**
 * The order a question's options are shown in.
 *
 * Questions were written with the right answer second far more often than
 * not (B in three of every four), and a learner who notices that can score
 * without knowing the law. So options are shown in a shuffled order rather
 * than the order they were written in.
 *
 * The shuffle is fixed by the question version, not random each time: the
 * same question shows the same order on a reload, in a session, in the
 * tutor's own message, and to the person who answers it later. Only
 * lettered options (a, b, c...) move. True and false stay in that order, and
 * a court diagram's options are courts, not a list.
 *
 * The letter shown beside an option is its place on the screen, never its
 * id: after shuffling, option "b" may well be shown as A.
 */

const LETTERS = 'ABCDEFGH';

/** The letter for the option shown at this place, from 0. */
export function optionLetter(index: number): string {
  return LETTERS[index] ?? String(index + 1);
}

/** The options in the order a learner sees them. */
export function deliveryOrder<T extends { id: string }>(options: T[], seed: string): T[] {
  if (options.length < 2 || !options.every((o) => /^[a-h]$/.test(o.id))) return options;
  const random = mulberry32(fnv1a(seed));
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
