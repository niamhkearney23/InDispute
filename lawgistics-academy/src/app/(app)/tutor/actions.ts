'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { hasAccess } from '@/lib/access/service';
import { getProvider } from '@/lib/ai/provider';
import { moduleBySlug } from '@/content/seed/modules';
import {
  DAILY_LIMIT,
  EXPLAIN_SYSTEM,
  LEARNER_MAX,
  TEST_SYSTEM,
  asMode,
  cleanReply,
  explainOpening,
  explainPrompt,
  isCorrect,
  nextQuestion,
  plainVerdict,
  questionMessage,
  testLength,
  testProgress,
  testPrompt,
  testSummary,
} from '@/lib/tutor/rules';
import {
  addMessage,
  conversation,
  messages,
  messagesInLastDay,
  startConversation,
  verifiedQuestion,
  verifiedQuestions,
} from '@/lib/tutor/service';

export interface TutorState {
  error: string | null;
}

const NO_ACCESS = 'The tutor needs a plan, or a code from your firm. See the pricing page.';
const LIMIT_REACHED = `That is ${DAILY_LIMIT} messages to the tutor in a day, the most it takes. Try again tomorrow.`;

/**
 * Starting a conversation. "Explain it back" opens with a fixed instruction
 * and needs no AI; "Test me" opens with a verified question from the
 * module, and refuses a module with none.
 */
export async function startTutor(_prev: TutorState, formData: FormData): Promise<TutorState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/tutor');
  if (!(await hasAccess(user.id))) return { error: NO_ACCESS };

  const profile = await getLearnerProfile(user.id);
  if (!profile) return { error: 'Your profile could not be read. Reload and try again.' };

  const mode = asMode(formData.get('mode'));
  if (!mode) return { error: 'Choose how you want to practise.' };

  let id: string | null = null;
  if (mode === 'explain') {
    const topic = String(formData.get('topic') ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    if (topic.length < 3) return { error: 'Say what you are going to explain, in a few words.' };
    if (topic.length > 120)
      return { error: 'Keep the topic short: a few words, not the explanation.' };
    id = await startConversation({ userId: user.id, mode, topic, moduleSlug: null });
    if (id) await addMessage(id, { role: 'tutor', body: explainOpening(topic) });
  } else {
    const slug = String(formData.get('module') ?? '');
    const chosen = moduleBySlug(slug);
    if (!chosen || chosen.country !== profile.country) return { error: 'Choose a module.' };
    const pool = await verifiedQuestions(profile.country, slug);
    const first = nextQuestion(pool, []);
    if (!first) {
      return {
        error:
          'No questions in that module have been checked by a lawyer yet, so the tutor has nothing to ask.',
      };
    }
    id = await startConversation({ userId: user.id, mode, topic: chosen.name, moduleSlug: slug });
    if (id) {
      await addMessage(id, {
        role: 'tutor',
        body: questionMessage(first, 1, testLength(pool.length)),
        questionVersionId: first.versionId,
      });
    }
  }

  if (!id) return { error: 'That could not be started. Please try again.' };
  revalidatePath('/tutor');
  redirect(`/tutor/${id}`);
}

/**
 * Checks shared by both kinds of reply, once the action has established who
 * is asking: access, whose conversation it is, and today's limit.
 */
async function ownConversation(userId: string, conversationId: unknown, mode: 'explain' | 'test') {
  if (!(await hasAccess(userId))) return { ok: false, error: NO_ACCESS } as const;

  const id = z.string().uuid().safeParse(conversationId);
  if (!id.success) return { ok: false, error: 'That conversation could not be found.' } as const;
  const convo = await conversation(id.data);
  if (!convo || convo.userId !== userId || convo.mode !== mode) {
    return { ok: false, error: 'That conversation could not be found.' } as const;
  }
  if ((await messagesInLastDay(userId)) >= DAILY_LIMIT)
    return { ok: false, error: LIMIT_REACHED } as const;
  return { ok: true, convo } as const;
}

/** "Explain it back": the learner's next attempt, and the tutor's one question. */
export async function sendExplanation(_prev: TutorState, formData: FormData): Promise<TutorState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  const checked = await ownConversation(user.id, formData.get('conversationId'), 'explain');
  if (!checked.ok) return { error: checked.error };
  const { convo } = checked;

  const body = String(formData.get('body') ?? '')
    .trim()
    .slice(0, LEARNER_MAX);
  if (body.length < 2) return { error: 'Write your explanation first.' };

  if (!(await addMessage(convo.id, { role: 'learner', body }))) {
    return { error: 'That could not be saved. Please try again.' };
  }
  revalidatePath(`/tutor/${convo.id}`);

  const provider = getProvider();
  if (!provider) {
    return { error: 'The tutor is not switched on at the moment. What you wrote is saved.' };
  }
  let reply = '';
  try {
    const history = await messages(convo.id);
    reply = cleanReply(
      await provider.complete({
        system: EXPLAIN_SYSTEM,
        prompt: explainPrompt(
          convo.topic,
          history.map((m) => ({ role: m.role, body: m.body })),
        ),
        maxTokens: 350,
        temperature: 0.4,
      }),
    );
  } catch {
    reply = '';
  }
  if (!reply) {
    return {
      error:
        'The tutor could not reply just now. What you wrote is saved; send another message in a minute.',
    };
  }
  await addMessage(convo.id, { role: 'tutor', body: reply });
  revalidatePath(`/tutor/${convo.id}`);
  return { error: null };
}

/**
 * "Test me": an answer to the question waiting. Marked by the server from
 * the verified answer key; what the tutor then says is drawn from the
 * verified explanation, and the page shows that explanation beside it.
 */
export async function answerTutorQuestion(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  const checked = await ownConversation(user.id, formData.get('conversationId'), 'test');
  if (!checked.ok) return { error: checked.error };
  const { convo } = checked;

  const history = await messages(convo.id);
  const progress = testProgress(history);
  if (!progress.current) return { error: 'This test has finished.' };

  const question = await verifiedQuestion(progress.current);
  if (!question)
    return { error: 'This question has been taken back for checking. Start a new test.' };

  const chosen = String(formData.get('option') ?? '');
  if (!question.options.some((o) => o.id === chosen)) return { error: 'Choose an answer.' };
  const reason = String(formData.get('reason') ?? '')
    .trim()
    .slice(0, 600);
  const correct = isCorrect(question, chosen);

  const saved = await addMessage(convo.id, {
    role: 'learner',
    body: `${chosen.toUpperCase()}${reason ? `. ${reason}` : ''}`,
    questionVersionId: question.versionId,
    chosenOption: chosen,
    correct,
  });
  if (!saved) return { error: 'That could not be saved. Please try again.' };

  let verdict = '';
  const provider = getProvider();
  if (provider) {
    try {
      verdict = cleanReply(
        await provider.complete({
          system: TEST_SYSTEM,
          prompt: testPrompt({ question, chosen, reason, correct }),
          maxTokens: 250,
          temperature: 0.3,
        }),
      );
    } catch {
      verdict = '';
    }
  }
  await addMessage(convo.id, {
    role: 'tutor',
    body: verdict ? `${correct ? 'Right.' : 'Not quite.'} ${verdict}` : plainVerdict(correct),
  });

  const results = [...progress.results, { number: progress.results.length + 1, correct }];
  const testModule = convo.moduleSlug ? moduleBySlug(convo.moduleSlug) : null;
  const pool = testModule ? await verifiedQuestions(testModule.country, testModule.slug) : [];
  const total = testLength(Math.max(pool.length, results.length));
  const next = results.length < total ? nextQuestion(pool, progress.asked) : null;
  if (next) {
    await addMessage(convo.id, {
      role: 'tutor',
      body: questionMessage(next, results.length + 1, total),
      questionVersionId: next.versionId,
    });
  } else {
    await addMessage(convo.id, { role: 'tutor', body: testSummary(results) });
  }

  revalidatePath(`/tutor/${convo.id}`);
  return { error: null };
}
