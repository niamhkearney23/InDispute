import Link from '@/components/app-link';
import { ButtonLink, cn } from '@/components/ui';
import type { NextTask } from '@/lib/homework/next-task';

/**
 * The one thing to do next, at the top of Today: what, when it is due, and
 * where the feedback will be. When everything is done it says so, and points
 * at the last piece of work marked Good, the end of the loop.
 */
export function NextTaskCard({
  task,
  markedGood,
}: {
  task: NextTask | null;
  markedGood: { id: string; title: string } | null;
}) {
  return (
    <section
      aria-labelledby="next-task"
      className={cn(
        'panel overflow-hidden rounded-lg border bg-paper-raised shadow-card',
        task?.urgent ? 'border-accent' : 'border-rule',
      )}
    >
      <div className={cn('h-1', task?.urgent ? 'bg-accent' : 'bg-rule-strong')} aria-hidden />
      <div className="p-5 sm:p-6">
        <p className="eyebrow mb-1.5">Your next task</p>
        {task ? (
          <>
            <h2 id="next-task" className="text-2xl leading-snug">
              {task.title}
            </h2>
            <p className="mt-2 text-slate">{task.detail}</p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              {task.due ? (
                <>
                  <dt className="font-semibold text-ink">When</dt>
                  <dd className={cn('text-slate', task.urgent && 'font-medium text-ink')}>{task.due}</dd>
                </>
              ) : null}
              <dt className="font-semibold text-ink">Feedback</dt>
              <dd className="text-slate">{task.feedback}</dd>
            </dl>
            <div className="mt-5">
              <ButtonLink href={task.href} variant="accent" className="w-full sm:w-auto">
                {task.action}
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <h2 id="next-task" className="text-2xl leading-snug">
              You are up to date
            </h2>
            <p className="mt-2 text-slate">
              Nothing is due from you right now. Anything your coach sets will appear here first.
            </p>
          </>
        )}
        {markedGood ? (
          <p className="mt-4 border-t border-rule pt-3 text-sm text-slate">
            Your coach marked <strong className="font-semibold text-ink">{markedGood.title}</strong> Good.{' '}
            <Link
              href={`/work/${markedGood.id}#feedback`}
              className="-my-2 inline-block py-2 font-medium text-accent underline underline-offset-2"
            >
              Read the feedback
            </Link>
            . It counts on your{' '}
            <Link href="/skills" className="-my-2 inline-block py-2 font-medium text-accent underline underline-offset-2">
              Progress page
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
