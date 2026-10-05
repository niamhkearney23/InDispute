'use server';

import { optionLetter } from '@/lib/learning/option-order';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { hasAccess } from '@/lib/access/service';
import { getProvider } from '@/lib/ai/provider';
import { moduleBySlug } from '@/content/seed/modules';
import {
  CONVERSATION_TURNS,
  DAILY_CONVERSATIONS,
  DAILY_LIMIT,
  EXPLAIN_OPENING,
  EXPLAIN_SYSTEM,
  LEARNER_MAX,
  SKIPPED,
  TEST_LENGTH,
  TEST_SYSTEM,
  asMode,
  cleanReply,
  explainPrompt,
  isCorrect,
  nextQuestion,
  plainVerdict,
  questionMessage,
  testAllowedText,
  testLength,
  testProgress,
  testPrompt,
  testSummary,
} from '@/lib/tutor/rules';
import { SAFE_EXPLAIN_REPLY, statesUncheckedLaw } from '@/lib/tutor/guard';
import {
  addMessage,
  conversation,
  messages,
  startConversation,
  usageToday,
  verifiedQuestion,
  verifiedQuestions,
} from '@/lib/tutor/service';

export interface TutorState {
  error: string | null;
  /**
   * What the learner typed, handed back with an error. React clears a form
   * after its action runs, and an explanation that vanishes because the AI
   * was busy is an explanation nobody writes twice.
   */
  draft?: string;
  /** "Test me": the option chosen, handed back with an error. */
  option?: string;
}

const NO_ACCESS = 'The tutor needs a plan, or a code from your firm. See the pricing page.';
const LIMIT_REACHED = `That is ${DAILY_LIMIT} messages to the tutor in a day, the most it takes. Try again tomorrow.`;
const TOO_MANY_STARTED = `That is ${DAILY_CONVERSATIONS} conversations started today, the most the tutor takes. Carry on with one you have, or come back tomorrow.`;
const AI_OFF = 'The tutor is not switched on at the moment, so it cannot reply. Try again later.';
const NOT_FOUND = 'That conversation could not be found.';
const ALREADY_ANSWERED =
  'That question has already been answered, perhaps in another tab. The page now shows where the test is up to.';

/**
 * Starting a conversation. "Explain it back" opens with fixed words and
 * needs the AI for every reply after, so it does not start without it.
 * "Test me" opens with a checked question from the module, and refuses a
 * module with none.
 */
export async function startTutor(_prev: TutorState, formData: FormData): Promise<TutorState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/tutor');
  if (!(await hasAccess(user.id))) return { error: NO_ACCESS };

  const profile = await getLearnerProfile(user.id);
  if (!profile) return { error: 'Your profile could not be read. Reload and try again.' };

  const mode = asMode(formData.get('mode'));
  if (!mode) return { error: 'Choose how you want to practise.' };

  const usage = await usageToday(user.id);
  if (!usage || usage.conversations >= DAILY_CONVERSATIONS) return { error: TOO_MANY_STARTED };

  let id: string | null = null;
  if (mode === 'explain') {
    const topic = String(formData.get('topic') ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!getProvider()) return { error: AI_OFF, draft: topic };
    if (topic.length < 3) {
      return { error: 'Say what you are going to explain, in a few words.', draft: topic };
    }
    if (topic.length > 120) {
      return { error: 'Keep the topic short: a few words, not the explanation.', draft: topic };
    }
    id = await startConversation({
      userId: user.id,
      mode,
      topic,
      moduleSlug: null,
      testLength: null,
    });
    if (id && (await addMessage(id, { role: 'tutor', body: EXPLAIN_OPENING })) !== 'saved') {
      id = null;
    }
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
    const total = testLength(pool.length);
    id = await startConversation({
      userId: user.id,
      mode,
      topic: chosen.name,
      moduleSlug: slug,
      testLength: total,
    });
    if (
      id &&
      (await addMessage(id, {
        role: 'tutor',
        body: questionMessage(first, 1, total),
        questionVersionId: first.versionId,
      })) !== 'saved'
    ) {
      id = null;
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
  if (!id.success) return { ok: false, error: NOT_FOUND } as const;
  const convo = await conversation(id.data);
  if (!convo || convo.userId !== userId || convo.mode !== mode) {
    return { ok: false, error: NOT_FOUND } as const;
  }
  // A count that cannot be read counts as the limit reached.
  const usage = await usageToday(userId);
  if (!usage || usage.messages >= DAILY_LIMIT) return { ok: false, error: LIMIT_REACHED } as const;
  return { ok: true, convo } as const;
}

/**
 * "Explain it back": the learner's next attempt, and the tutor's one
 * question. With "retry", no new attempt: the tutor answers the last one,
 * which it could not reply to before.
 */
export async function sendExplanation(_prev: TutorState, formData: FormData): Promise<TutorState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  const retry = formData.get('retry') === '1';
  const body = String(formData.get('body') ?? '')
    .trim()
    .slice(0, LEARNER_MAX);

  const checked = await ownConversation(user.id, formData.get('conversationId'), 'explain');
  if (!checked.ok) return { error: checked.error, draft: body };
  const { convo } = checked;

  // Without the AI there is no reply, so nothing is saved that would sit
  // there unanswered.
  const provider = getProvider();
  if (!provider) return { error: AI_OFF, draft: body };

  let history = await messages(convo.id);
  const last = history[history.length - 1];
  if (retry) {
    if (!last || last.role !== 'learner') return { error: null };
  } else {
    if (body.length < 2) return { error: 'Write your explanation first.', draft: body };
    const turns = history.filter((m) => m.role === 'learner').length;
    if (turns >= CONVERSATION_TURNS) {
      return {
        error: `That is ${CONVERSATION_TURNS} messages in one conversation, the most it takes. Start a new one on the same idea.`,
        draft: body,
      };
    }
    if ((await addMessage(convo.id, { role: 'learner', body })) !== 'saved') {
      return { error: 'That could not be saved. Please try again.', draft: body };
    }
    history = [...history, { role: 'learner', body } as (typeof history)[number]];
  }
  revalidatePath(`/tutor/${convo.id}`);

  let reply = '';
  try {
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
        'The tutor could not reply just now. What you wrote is saved; press "Ask again" in a minute.',
    };
  }
  // The tutor may repeat the learner's own words back to them, and nothing
  // else that looks like law: everything it says about the law comes from
  // the lesson or a coach, never from the model.
  const theirWords = [convo.topic, ...history.filter((m) => m.role === 'learner').map((m) => m.body)];
  if (statesUncheckedLaw(reply, theirWords.join(' '))) reply = SAFE_EXPLAIN_REPLY;

  if ((await addMessage(convo.id, { role: 'tutor', body: reply })) !== 'saved') {
    return { error: 'The tutor replied but it could not be saved. Press "Ask again".' };
  }
  revalidatePath(`/tutor/${convo.id}`);
  return { error: null };
}

/**
 * "Test me": an answer to the question waiting, or, when that question has
 * been taken back for checking since it was asked, moving past it. Marked by
 * the server from the checked answer key; what the tutor then says is drawn
 * from the checked explanation, and the page shows that explanation beside
 * it.
 */
export async function answerTutorQuestion(
  _prev: TutorState,
  formData: FormData,
): Promise<TutorState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  const reason = String(formData.get('reason') ?? '')
    .trim()
    .slice(0, 600);
  const chosen = String(formData.get('option') ?? '');
  const keep = { draft: reason, option: chosen };

  const checked = await ownConversation(user.id, formData.get('conversationId'), 'test');
  if (!checked.ok) return { error: checked.error, ...keep };
  const { convo } = checked;

  const history = await messages(convo.id);
  const progress = testProgress(history);
  // The page names the question it was showing. If that is no longer the
  // one waiting, this is a second press or another tab, and the answer was
  // meant for a question that has already been dealt with.
  if (!progress.current || formData.get('questionVersionId') !== progress.current) {
    revalidatePath(`/tutor/${convo.id}`);
    return { error: progress.current ? ALREADY_ANSWERED : 'This test has finished.' };
  }
  const number = progress.asked.indexOf(progress.current) + 1;

  const question = await verifiedQuestion(progress.current);
  let marked: { number: number; correct: boolean } | null = null;
  let problem = false;

  if (!question) {
    // Taken back since it was asked: changed, flagged, or its sign-off
    // lapsed. It is not marked, and the test moves on.
    if (formData.get('skip') !== '1') {
      revalidatePath(`/tutor/${convo.id}`);
      return { error: 'This question has been taken back for checking. Press "Carry on".' };
    }
    const saved = await addMessage(convo.id, {
      role: 'learner',
      body: SKIPPED,
      questionVersionId: progress.current,
    });
    if (saved === 'duplicate') return { error: ALREADY_ANSWERED };
    if (saved === 'failed') return { error: 'That could not be saved. Please try again.' };
  } else {
    if (!question.options.some((o) => o.id === chosen)) {
      return { error: 'Choose an answer.', ...keep };
    }
    const correct = isCorrect(question, chosen);
    const saved = await addMessage(convo.id, {
      role: 'learner',
      // The letter the learner saw beside it, which after shuffling is its
      // place on the screen rather than its id.
      body: `${optionLetter(question.options.findIndex((o) => o.id === chosen))}${reason ? `. ${reason}` : ''}`,
      questionVersionId: question.versionId,
      chosenOption: chosen,
      correct,
    });
    if (saved === 'duplicate') {
      revalidatePath(`/tutor/${convo.id}`);
      return { error: ALREADY_ANSWERED };
    }
    if (saved === 'failed') return { error: 'That could not be saved. Please try again.', ...keep };
    marked = { number, correct };

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
    // Anything that looks like law and is not in the checked words (or the
    // learner's own reason) means the reply is not used.
    if (verdict && statesUncheckedLaw(verdict, testAllowedText(question, reason))) verdict = '';
    const said = await addMessage(convo.id, {
      role: 'tutor',
      body: verdict ? `${correct ? 'Right.' : 'Not quite.'} ${verdict}` : plainVerdict(correct),
    });
    if (said !== 'saved') problem = true;
  }

  const results = marked ? [...progress.results, marked] : progress.results;
  const total = convo.testLength ?? TEST_LENGTH;
  const testModule = convo.moduleSlug ? moduleBySlug(convo.moduleSlug) : null;
  const pool =
    testModule && progress.asked.length < total
      ? await verifiedQuestions(testModule.country, testModule.slug)
      : [];
  const next = progress.asked.length < total ? nextQuestion(pool, progress.asked) : null;
  const ending = next
    ? await addMessage(convo.id, {
        role: 'tutor',
        body: questionMessage(next, progress.asked.length + 1, total),
        questionVersionId: next.versionId,
      })
    : await addMessage(convo.id, { role: 'tutor', body: testSummary(results) });
  if (ending === 'failed') problem = true;

  revalidatePath(`/tutor/${convo.id}`);
  return problem
    ? { error: 'Your answer is saved, but part of the reply was not. Reload the page.' }
    : { error: null };
}
