import 'server-only';
import { getProvider } from '@/lib/ai/provider';
import { createServiceClient } from '@/lib/supabase/service';
import { lessonFor } from '@/lib/content/service';
import { modulesFor } from '@/content/seed/modules';
import { statesUncheckedLaw, judgesTheLaw } from '@/lib/tutor/guard';
import type { Country } from '@/lib/types';
import {
  ASK_SYSTEM,
  DAILY_ASKS,
  askPrompt,
  pickPassages,
  sourcesOf,
  type AskResult,
  type Passage,
} from './rules';

/** Every step of every signed-off lesson this person's country has. */
export async function lessonPassages(country: Country): Promise<Passage[]> {
  const lessons = await Promise.all(modulesFor(country).map((m) => lessonFor(m.slug, false)));
  const out: Passage[] = [];
  for (const { lesson } of lessons) {
    if (!lesson || !lesson.checked) continue;
    lesson.item.steps.forEach((s, step) =>
      out.push({
        moduleSlug: lesson.item.moduleSlug,
        lessonTitle: lesson.item.title,
        step,
        heading: s.heading,
        text: [s.body, s.takeaway].filter(Boolean).join(' '),
      }),
    );
  }
  return out;
}

/** Questions asked in the last day, or null if that cannot be read (counted as the limit). */
async function askedToday(userId: string): Promise<number | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await createServiceClient()
    .from('ask_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('asked_at', since);
  return error || count === null ? null : count;
}

async function noteAsked(userId: string): Promise<void> {
  const { error } = await createServiceClient().from('ask_usage').insert({ user_id: userId });
  if (error) console.error('[ask] could not count a question', error);
}

/**
 * Answer a question from signed-off lessons. No match: no AI is asked. A match
 * with the AI off, failing, or saying something the passages do not: the
 * matching lesson text itself is shown, never a guess.
 */
export async function ask(userId: string, country: Country, question: string): Promise<AskResult> {
  const passages = pickPassages(question, await lessonPassages(country));
  if (passages.length === 0) return { kind: 'notCovered' };
  const sources = sourcesOf(passages);
  const quoted = () => ({
    kind: 'answer' as const,
    text: passages.map((p) => p.text).join('\n\n'),
    sources,
    written: false,
  });

  const provider = getProvider();
  if (!provider) return quoted();

  const used = await askedToday(userId);
  if (used === null || used >= DAILY_ASKS) return { kind: 'limit' };
  await noteAsked(userId);

  try {
    const reply = (
      await provider.complete({
        system: ASK_SYSTEM,
        prompt: askPrompt(question, passages),
        maxTokens: 300,
        temperature: 0.2,
      })
    ).trim();
    if (!reply || reply.includes('NOT_IN_LESSONS')) return quoted();
    const checked = passages.map((p) => `${p.heading} ${p.text}`).join(' ');
    if (statesUncheckedLaw(reply, checked, question) || judgesTheLaw(reply)) return quoted();
    return { kind: 'answer', text: reply, sources, written: true };
  } catch (error) {
    console.error('[ask] the AI failed, showing the lesson text instead', error);
    return quoted();
  }
}
