import { cn } from '@/components/ui';

export interface ThreadMessage {
  id: string;
  role: 'learner' | 'tutor';
  body: string;
  questionVersionId: string | null;
  correct: boolean | null;
}

/**
 * A tutor conversation, as the learner and their coaches see it. The tutor
 * on the left, the learner on the right. After each "Test me" answer, the
 * lawyer-checked explanation for that question, in its own box so it is
 * plain which words a lawyer stands behind and which the AI wrote.
 */
export function TutorThread({
  messages,
  learnerName = 'You',
  explanations = {},
}: {
  messages: ThreadMessage[];
  learnerName?: string;
  /** Checked explanations by question version, for answered questions. */
  explanations?: Record<string, string | null>;
}) {
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = m.role === 'learner';
        const explanation =
          mine && m.questionVersionId ? explanations[m.questionVersionId] : undefined;
        return (
          <li key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
            <p className="mb-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">
              {mine ? learnerName : 'Tutor'}
              {mine && m.correct !== null ? (
                <span
                  className={cn(
                    'ml-2 normal-case tracking-normal',
                    m.correct ? 'text-verdict-correct' : 'text-verdict-wrong',
                  )}
                >
                  {m.correct ? 'Right' : 'Not right'}
                </span>
              ) : null}
            </p>
            <div
              className={cn(
                'max-w-[min(36rem,92%)] rounded-xl px-4 py-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words',
                mine ? 'bg-accent text-paper' : 'border border-rule bg-paper-raised',
              )}
            >
              {m.body}
            </div>
            {explanation !== undefined ? (
              <div className="mt-2 max-w-[min(36rem,92%)] self-start rounded-xl border border-verdict-correct/25 bg-verdict-correct-wash px-4 py-3 text-sm leading-relaxed">
                <p className="mb-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-verdict-correct uppercase">
                  Checked by a lawyer
                </p>
                {explanation ?? 'This question has since been taken back for checking.'}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
