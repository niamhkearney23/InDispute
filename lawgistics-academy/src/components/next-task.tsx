import Link from '@/components/app-link';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui';
import type { NextTask } from '@/lib/homework/next-task';

/**
 * The one thing to do next, at the top of Today: what, when it is due, and
 * where the feedback will be. Navy, the one dark surface on the page, so it
 * reads as the place to start (the owner, November 2026: "cleaner, and more
 * premium"; no decorative light or shadow, the colour does the work). When
 * starting training is the task, the page passes the real
 * start button in, so there is one Start on the page, not two.
 */
export function NextTaskCard({
  task,
  markedGood,
  start,
}: {
  task: NextTask | null;
  markedGood: { id: string; title: string } | null;
  start?: ReactNode;
}) {
  const label = 'text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-paper/55';
  return (
    <section
      aria-labelledby="next-task"
      className="accent-surface relative overflow-hidden rounded-xl bg-ink px-5 py-6 text-paper sm:px-7 sm:py-7"
    >
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <p className={label}>Your next task</p>
          {task?.urgent ? (
            <span className="rounded-full bg-paper/12 px-2.5 py-0.5 text-xs font-medium text-paper/90">
              Needs you
            </span>
          ) : null}
        </div>
        {task ? (
          <>
            <h2 id="next-task" className="mt-2.5 text-[1.75rem] leading-tight text-paper sm:text-3xl">
              {task.title}
            </h2>
            <p className="mt-2 max-w-xl text-paper/75">{task.detail}</p>
            <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 text-sm">
              {task.due ? (
                <div>
                  <dt className={label}>When</dt>
                  <dd className="mt-1 text-paper">{task.due}</dd>
                </div>
              ) : null}
              <div className="min-w-0 max-w-md">
                <dt className={label}>Feedback</dt>
                <dd className="mt-1 text-paper/85">{task.feedback}</dd>
              </div>
            </dl>
            <div className="mt-6">
              {start ?? (
                <ButtonLink href={task.href} variant="light" size="lg">
                  {task.action}
                </ButtonLink>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 id="next-task" className="mt-2.5 text-[1.75rem] leading-tight text-paper sm:text-3xl">
              You are up to date
            </h2>
            <p className="mt-2 max-w-xl text-paper/75">
              Nothing is due from you right now. Anything your coach sets will appear here first.
            </p>
          </>
        )}
        {markedGood ? (
          <p className="mt-6 border-t border-paper/15 pt-4 text-sm text-paper/75">
            Your coach marked <strong className="font-semibold text-paper">{markedGood.title}</strong> Good.{' '}
            <Link
              href={`/work/${markedGood.id}#feedback`}
              className="-my-2 inline-block py-2 font-medium text-paper underline underline-offset-2"
            >
              Read the feedback
            </Link>
            . It counts on your{' '}
            <Link href="/skills" className="-my-2 inline-block py-2 font-medium text-paper underline underline-offset-2">
              Progress page
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
