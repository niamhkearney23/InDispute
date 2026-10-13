import { DRAFT_LESSONS, lessonForModule, type SeedLesson } from '@/content/seed/lessons';

/**
 * The publication rule for legal content, in one place (0044 for questions
 * and daily facts, 0046 for everything else):
 *
 *   A learner sees an item only when a qualified lawyer has signed off its
 *   current wording. Until then it is simply not shown to them.
 *
 *   Staff (an administrator, a coach, a firm administrator) still see it, so
 *   they can review it, and it is labelled as not yet checked.
 *
 * Plain functions, so the rule can be tested without a database. The server
 * code that reads the sign-offs is src/lib/content/service.ts.
 */

export interface Shown<T> {
  item: T;
  /** False only for staff looking at something not yet signed off. */
  checked: boolean;
}

/** Whether this person is staff, and so sees unsigned content, labelled. */
export function isStaff(
  profile: { isAdmin?: boolean; isCoach?: boolean; isFirmAdmin?: boolean } | null | undefined,
): boolean {
  return Boolean(profile?.isAdmin || profile?.isCoach || profile?.isFirmAdmin);
}

/** The rule itself. */
export function forViewer<T>(
  item: T | null | undefined,
  checked: boolean,
  staff: boolean,
): Shown<T> | null {
  if (item === null || item === undefined) return null;
  if (checked) return { item, checked: true };
  return staff ? { item, checked: false } : null;
}

export interface LessonForViewer {
  lesson: Shown<SeedLesson> | null;
  /** A lesson exists for this module but is waiting for a lawyer's check. */
  waiting: boolean;
}

/**
 * The lesson a module shows this person. A signed-off rewrite takes its
 * original's place. Otherwise the original, if it is signed off; for staff,
 * the original even when it is not, labelled. A rewrite nobody has signed is
 * read at Admin, Lessons and nowhere else.
 */
export function lessonForViewer(
  moduleSlug: string,
  signedOff: (slug: string) => boolean,
  staff: boolean,
): LessonForViewer {
  const rewrite = DRAFT_LESSONS.find((l) => l.moduleSlug === moduleSlug && signedOff(l.slug));
  const lesson = rewrite ?? lessonForModule(moduleSlug);
  if (!lesson) return { lesson: null, waiting: false };
  const shown = forViewer(lesson, signedOff(lesson.slug), staff);
  return { lesson: shown, waiting: shown === null };
}
