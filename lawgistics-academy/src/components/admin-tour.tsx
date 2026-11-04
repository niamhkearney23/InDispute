'use client';

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/app-link';

type Step = { title: string; text: string; href?: string; action?: string };

export function AdminTour({ userId, allowedPaths }: { userId: string; allowedPaths: string[] }) {
  const panel = useRef<HTMLDetailsElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const storageKey = 'academy:admin-tour:v1:' + userId;
  const steps: Step[] = [
    { title: 'Start with just three things', text: 'Check your people, set their work, then give feedback. Today, the first screen, lists what needs you each morning, most pressing first. This quick tour shows where each thing lives.', href: '/admin/today', action: 'Open Today' },
    { title: '1. Check who needs your help', text: 'People > Trainees shows progress and topics people find difficult. Joining is where you review their preparation before confirming they are ready.', href: '/admin/trainees', action: 'Open Trainees' },
    { title: '2. Set the work for today', text: 'Teaching > Morning notes puts your instructions on the learner’s Today page. Sessions holds your teaching videos. The Work board is where you post a task or reading.', href: '/admin/notes', action: 'Open Morning notes' },
    { title: '3. Give feedback', text: 'Open Teaching > Work board to read submissions, leave a verdict and comment, and reply to questions. This is a useful place to return to each day.', href: '/admin/work', action: 'Open Work board' },
    ...(allowedPaths.includes('/admin/review') ? [
      { title: 'Before teaching from the question bank', text: 'Content > Sign off is the lawyer review queue. Review the actual words and sources before signing. Signing off and publishing are separate steps; publishing requires the appropriate permissions.', href: '/admin/review', action: 'Open Sign off' },
    ] : []),
    { title: 'You do not need every menu today', text: 'Use Intake when preparing a group. Start each morning on Today, which links to Trainees and the Work board. The other menus are there when you need them. Reopen this Quick tour at any time.', href: '/admin/intake', action: 'Open Intake' },
  ].filter((step) => !step.href || allowedPaths.includes(step.href));
  const step = steps[Math.min(index, steps.length - 1)];
  const button = 'min-h-11 rounded-[5px] border border-rule-strong px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  useEffect(() => {
    try {
      if (panel.current) panel.current.open = localStorage.getItem(storageKey) !== 'done';
    } catch {
      if (panel.current) panel.current.open = true;
    }
  }, [storageKey]);

  function remember() {
    try { localStorage.setItem(storageKey, 'done'); } catch { /* The tour still works without storage. */ }
  }

  function close() {
    remember();
    if (panel.current) {
      panel.current.open = false;
      panel.current.querySelector('summary')?.focus();
    }
  }

  function move(next: number) {
    setIndex(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <details ref={panel} className="mb-6 rounded-lg border border-rule bg-paper-raised shadow-card"
      onToggle={(event) => {
        if (event.currentTarget.open) setIndex(0);
        else remember();
      }}>
      <summary className="cursor-pointer px-5 py-4 font-medium focus-visible:outline focus-visible:outline-2">
        Quick tour: how to use Admin
      </summary>
      <section className="border-t border-rule p-5 sm:p-6" aria-label="Admin walkthrough">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow" aria-live="polite">Step {index + 1} of {steps.length}</p>
          <button type="button" onClick={close} className={button}>Skip tour</button>
        </div>
        <h2 ref={heading} tabIndex={-1} className="text-2xl focus-visible:outline focus-visible:outline-2">{step.title}</h2>
        <p className="mt-3 max-w-2xl text-slate">{step.text}</p>
        {step.href ? (
          <Link href={step.href} className="mt-3 inline-flex min-h-11 items-center py-2 font-medium underline underline-offset-4">
            {step.action}
          </Link>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button type="button" disabled={index === 0} onClick={() => move(index - 1)}
            className={button + ' disabled:opacity-40'}>Back</button>
          {index < steps.length - 1 ? (
            <button type="button" onClick={() => move(index + 1)} className={button + ' bg-ink text-paper'}>Next</button>
          ) : (
            <button type="button" onClick={close} className={button + ' bg-ink text-paper'}>Finish tour</button>
          )}
        </div>
      </section>
    </details>
  );
}
