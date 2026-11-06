/**
 * The first visit, in order, with nothing else open until each is done (the
 * owner, November 2026: "when it first opened up, it says like hi, what's
 * your name? Then it says do a test to see where you're at and don't have
 * another option. You can't access anything else till you finish those
 * first 30 questions ... For the first time").
 *
 * 1. The first steps (`/onboarding`): their name, their cartoon, a few
 *    choices about their training.
 * 2. The diagnostic, while there are questions to sit it with. Today shows
 *    only it; the rest of the academy opens when it is finished, and the
 *    diagnostic is never asked for again.
 *
 * Staff are never held here. Without published questions for their country
 * the diagnostic cannot be taken, so it holds nobody. Pure, so the paths a
 * person may open while held can be tested.
 */

export type FirstStep = 'onboarding' | 'diagnostic';

export function firstStepFor(person: {
  staff: boolean;
  onboarded: boolean;
  diagnosticDone: boolean;
  /** Questions are published for their country, so the diagnostic can be taken. */
  questionsOpen: boolean;
}): FirstStep | null {
  if (person.staff) return null;
  if (!person.onboarded) return 'onboarding';
  if (!person.diagnosticDone && person.questionsOpen) return 'diagnostic';
  return null;
}

/**
 * What stays open while somebody is held: the step itself, their account
 * (to sign out, change a password or delete the account), and the plan
 * page, which the access check sends somebody to who has not paid.
 */
const ALWAYS = ['/account', '/pricing'];
const OPEN_DURING: Record<FirstStep, string[]> = {
  onboarding: ['/onboarding', ...ALWAYS],
  // Today shows only the diagnostic; the questions themselves run at /train.
  diagnostic: ['/dashboard', '/diagnostic', '/train', ...ALWAYS],
};

/** Where somebody is sent when they ask for anything else. */
export const FIRST_STEP_HOME: Record<FirstStep, string> = {
  onboarding: '/onboarding',
  diagnostic: '/dashboard',
};

/** Whether a page (its path, with or without a query) may open during the step. */
export function openDuring(step: FirstStep, requested: string): boolean {
  const path = requested.split(/[?#]/)[0] || '/';
  return OPEN_DURING[step].some((allowed) => path === allowed || path.startsWith(`${allowed}/`));
}

/**
 * The pages drawn on the dark first-visit surface, the same as the sign-in
 * pages: the greeting and choices, Today's one card, the start of the
 * diagnostic and its result. The questions themselves, and the account
 * pages, stay on paper.
 */
export function darkDuring(step: FirstStep, requested: string): boolean {
  const path = requested.split(/[?#]/)[0] || '/';
  if (step === 'onboarding') return path === '/onboarding';
  return path === '/dashboard' || path === '/diagnostic' || path === '/diagnostic/results';
}
