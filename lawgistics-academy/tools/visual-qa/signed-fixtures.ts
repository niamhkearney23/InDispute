/**
 * Sign-off rows for the stand-in database, so the visual check draws both
 * sides of the rule (0046): some legal content signed off and shown to
 * learners, some not and replaced by "waiting for a lawyer's check".
 *
 * Printed as JSON and read by mock-supabase.mjs. Worked out from the code,
 * with the same fingerprints the app uses, so a change of wording here
 * shows up in the sweep exactly as it would on a real deployment: the item
 * goes back to waiting.
 *
 * Signed: the Malaysian court map, and the Australian court lesson.
 * Not signed: the Australian court map (so an Australian learner sees a
 * signed lesson with its court diagram waiting), every other lesson and
 * every essay topic.
 */
import { LESSONS } from '../../src/content/seed/lessons';
import { courtMapKey, lessonHash, referenceByKey, referenceHash } from '../../src/lib/content/wording';

const REVIEWER = '66666666-6666-6666-6666-666666666666';
const AT = '2026-10-01T09:00:00Z';

const courtsMy = referenceByKey(courtMapKey('MY'))!;
const courtsAuLesson = LESSONS.find((l) => l.slug === 'courts-au-intro')!;

process.stdout.write(
  JSON.stringify({
    content_signoffs: [
      {
        content_key: courtsMy.key,
        content_hash: referenceHash(courtsMy),
        signed_by: REVIEWER,
        signed_at: AT,
      },
    ],
    lesson_signoffs: [
      {
        lesson_slug: courtsAuLesson.slug,
        content_hash: lessonHash(courtsAuLesson),
        signed_by: REVIEWER,
        signed_at: AT,
      },
    ],
  }),
);
