'use client';

import { optionLetter } from '@/lib/learning/option-order';
import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { answerTutorQuestion, sendExplanation, startTutor, type TutorState } from './actions';

const INPUT =
  'w-full rounded-md border-2 border-rule bg-paper-raised px-3 py-2.5 text-base outline-none placeholder:text-muted/70 focus:border-accent';

/** Starting "Explain it back": what are you going to explain? */
export function StartExplainForm({ suggestions }: { suggestions: string[] }) {
  const [state, action, pending] = useActionState<TutorState, FormData>(startTutor, {
    error: null,
  });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="mode" value="explain" />
      <label htmlFor="topic" className="block text-sm font-semibold">
        What will you explain?
      </label>
      <input
        id="topic"
        name="topic"
        required
        maxLength={120}
        defaultValue={state.draft}
        list="tutor-topics"
        placeholder="e.g. Setting aside a default judgment"
        className={INPUT}
      />
      <datalist id="tutor-topics">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Starting…' : 'Start explaining'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
    </form>
  );
}

/** Starting "Test me": which module? */
export function StartTestForm({
  modules,
}: {
  modules: Array<{ slug: string; name: string; verified: number }>;
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(startTutor, {
    error: null,
  });
  const usable = modules.filter((m) => m.verified > 0);
  if (usable.length === 0) {
    return (
      <p className="text-sm text-slate">
        No questions have been checked by a lawyer yet, so there is nothing to test you on. This
        opens as soon as they are.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="mode" value="test" />
      <label htmlFor="module" className="block text-sm font-semibold">
        Which module?
      </label>
      <select id="module" name="module" required className={INPUT} defaultValue={usable[0].slug}>
        {usable.map((m) => (
          <option key={m.slug} value={m.slug}>
            {m.name} ({m.verified} checked)
          </option>
        ))}
      </select>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Starting…' : 'Test me'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
    </form>
  );
}

/**
 * "Explain it back": the box for the next attempt. When the tutor has not
 * replied to the last one (the AI was busy), a button asks it again without
 * sending anything new.
 */
export function ExplainForm({
  conversationId,
  turn,
  unanswered,
}: {
  conversationId: string;
  turn: number;
  unanswered: boolean;
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(sendExplanation, {
    error: null,
  });
  return (
    <div className="space-y-4">
      {unanswered ? (
        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="conversationId" value={conversationId} />
          <input type="hidden" name="retry" value="1" />
          <p className="text-sm text-slate">The tutor has not replied to your last message.</p>
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? 'Asking…' : 'Ask again'}
          </Button>
        </form>
      ) : null}
      <form action={action} className="space-y-3" key={turn}>
        <input type="hidden" name="conversationId" value={conversationId} />
        <label htmlFor="body" className="sr-only">
          Your explanation
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          maxLength={2000}
          defaultValue={state.draft}
          placeholder="Explain it in your own words…"
          className={INPUT}
        />
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? 'The tutor is reading…' : 'Send'}
        </Button>
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      </form>
    </div>
  );
}

/**
 * "Test me": the answer to the question waiting, and why. The form names
 * the question it shows, so an answer from an old tab cannot land on a
 * different question.
 */
export function AnswerForm({
  conversationId,
  questionVersionId,
  options,
  turn,
}: {
  conversationId: string;
  questionVersionId: string;
  options: Array<{ id: string; text: string }>;
  turn: number;
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(answerTutorQuestion, {
    error: null,
  });
  return (
    <form action={action} className="space-y-4" key={turn}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="questionVersionId" value={questionVersionId} />
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Your answer</legend>
        {options.map((o, i) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-rule bg-paper-raised px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-wash"
          >
            <input
              type="radio"
              name="option"
              value={o.id}
              required
              defaultChecked={state.option === o.id}
              className="mt-1 accent-accent"
            />
            <span>
              <span className="font-semibold">{optionLetter(i)}.</span> {o.text}
            </span>
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="reason" className="mb-1 block text-sm font-semibold">
          Why?{' '}
          <span className="font-normal text-slate">
            (optional, but it helps the tutor find the gap)
          </span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          maxLength={600}
          defaultValue={state.draft}
          className={INPUT}
        />
      </div>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Checking…' : 'Answer'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
    </form>
  );
}

/**
 * "Test me", when the question waiting has been taken back for checking
 * since it was asked: it is not marked, and the test moves on.
 */
export function SkipForm({
  conversationId,
  questionVersionId,
}: {
  conversationId: string;
  questionVersionId: string;
}) {
  const [state, action, pending] = useActionState<TutorState, FormData>(answerTutorQuestion, {
    error: null,
  });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="questionVersionId" value={questionVersionId} />
      <input type="hidden" name="skip" value="1" />
      <p className="text-sm text-slate">
        This question has been taken back for a lawyer to look at again since it was asked, so it
        will not be marked.
      </p>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Moving on…' : 'Carry on'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
    </form>
  );
}
