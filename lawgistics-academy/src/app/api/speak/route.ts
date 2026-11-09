import { getCurrentUser } from '@/lib/supabase/server';
import { hasAccess } from '@/lib/access/service';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getFactOfTheDay } from '@/lib/facts/service';
import { lessonFor, viewerIsStaff } from '@/lib/content/service';
import { factText, lessonStepText } from '@/lib/speech/rules';
import { SpeechFailed, speak, speechConfigured } from '@/lib/speech/service';

/**
 * Reads a lesson screen or today's fact aloud. The page never sends words:
 * it names the thing ("lesson, this module, this screen", "today's fact"),
 * and the server finds the words itself, for this person, only as they may
 * see them (a learner gets a lesson only once a lawyer has signed it off, a
 * fact only with a current sign-off). Signed in and with access, like the
 * pages.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const plain = (status: number, text: string) => new Response(text, { status });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return plain(401, 'Sign in to listen.');
  if (!(await hasAccess(user.id))) return plain(403, 'This needs a plan, or a code from your firm.');
  if (!speechConfigured()) return plain(404, 'Reading aloud is not switched on.');

  const params = new URL(request.url).searchParams;
  const kind = params.get('kind');
  let text: string | null = null;

  if (kind === 'fact') {
    const profile = await getLearnerProfile(user.id);
    if (!profile) return plain(404, 'Nothing to read.');
    const fact = await getFactOfTheDay(profile.timezone, profile.country);
    text = fact ? factText(fact) : null;
  } else if (kind === 'lesson') {
    const moduleSlug = params.get('module') ?? '';
    const step = Number(params.get('step'));
    if (!/^[a-z0-9-]{1,60}$/.test(moduleSlug) || !Number.isInteger(step) || step < 0 || step > 200) {
      return plain(400, 'That could not be read.');
    }
    const { lesson } = await lessonFor(moduleSlug, await viewerIsStaff(user.id));
    const chosen = lesson?.item.steps[step];
    text = chosen ? lessonStepText(chosen) : null;
  } else {
    return plain(400, 'That could not be read.');
  }

  if (!text) return plain(404, 'Nothing to read.');
  try {
    const audio = await speak(text);
    return new Response(Buffer.from(audio), {
      headers: {
        'content-type': 'audio/mpeg',
        // This person's own copy, kept by their browser for a day: the
        // words may stop being signed off, so nothing shared holds it.
        'cache-control': 'private, max-age=86400',
        'content-length': String(audio.byteLength),
      },
    });
  } catch (error) {
    console.error('[speak] could not read aloud', error instanceof SpeechFailed ? error.message : error);
    return plain(502, 'It could not be read aloud just now.');
  }
}
