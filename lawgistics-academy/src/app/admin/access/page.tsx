import type { Metadata } from 'next';
import { requireCoach } from '@/lib/admin/guard';
import { Card, Pill } from '@/components/ui';
import { accessCodes, paymentsOn, waitingForAccess } from '@/lib/access/service';
import { CodeSwitch, NewCodeForm, WaitingRowForm } from './forms';

export const metadata: Metadata = { title: 'Access' };

/**
 * Codes for firms and universities, and the people waiting to be confirmed
 * on one. Coaches see and decide the waiting list; codes are an
 * administrator's.
 */
export default async function AccessPage() {
  const { isFirmAdmin } = await requireCoach();
  const [waiting, codes] = await Promise.all([
    waitingForAccess(),
    isFirmAdmin ? accessCodes() : Promise.resolve([]),
  ]);
  const on = paymentsOn();
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Access</p>
        <h1 className="text-3xl">Who trains free</h1>
        <p className="mt-3 max-w-2xl text-slate">
          People on their own pay. Staff, confirmed trainees, and anyone your firm invited are free.
          Anyone else from a firm or university you work with enters its code, and is free once
          somebody here confirms them.{' '}
          {on
            ? 'Payments are switched on.'
            : 'Payments are switched off, so for now nobody is charged.'}
        </p>
      </section>

      <Card>
        <h2 className="text-lg">
          {waiting.length === 0
            ? 'Nobody is waiting'
            : waiting.length === 1
              ? '1 person is waiting to be confirmed'
              : `${waiting.length} people are waiting to be confirmed`}
        </h2>
        <p className="mt-1 text-sm text-slate">
          Confirm only people you know are with that firm or university. &ldquo;Not with us&rdquo;
          leaves their account alone; they can still pay.
        </p>
        {waiting.length ? (
          <ul className="mt-4 divide-y divide-rule">
            {waiting.map((w) => (
              <WaitingRowForm
                key={w.userId}
                row={{
                  userId: w.userId,
                  name: w.name,
                  email: w.email,
                  label: w.label,
                  requestedOn: day(w.requestedAt),
                }}
              />
            ))}
          </ul>
        ) : null}
      </Card>

      {isFirmAdmin ? (
        <Card>
          <h2 className="text-lg">Codes</h2>
          <p className="mt-1 mb-5 text-sm text-slate">
            Give a firm or university one code to hand to its people. Switching a code off stops it
            for new people and ends it for everyone it made free.
          </p>
          {codes.length ? (
            <ul className="mb-6 divide-y divide-rule border-y border-rule">
              {codes.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {c.label} {c.active ? <Pill tone="correct">On</Pill> : <Pill>Off</Pill>}
                    </p>
                    <p className="font-mono text-sm text-slate">
                      {c.code} · {c.confirmed} confirmed
                    </p>
                  </div>
                  <CodeSwitch id={c.id} active={c.active} />
                </li>
              ))}
            </ul>
          ) : null}
          <NewCodeForm />
        </Card>
      ) : null}
    </div>
  );
}
