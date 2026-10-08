import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { certificateStatus } from '@/lib/certificate/service';
import { brand } from '@/lib/brand';
import { Card, Pill } from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import { PrintButton } from './print-button';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Certificate' };
export const dynamic = 'force-dynamic';

function longDate(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  });
}

/**
 * The certificate, or the way to it. It says exactly what was done and that
 * it is a training record, not a qualification, because a firm might be
 * shown it and the product's whole value is that its records are true.
 */
export default async function CertificatePage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/certificate');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const status = await certificateStatus(user.id, profile.country);
  const name = profile.displayName?.trim() || profile.email;

  if (!status.earned || !status.issuedAt) {
    const matterSteps = Math.min(status.mattersGood, status.mattersNeeded);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section>
          <p className="eyebrow mb-2">Certificate</p>
          <h1 className="text-3xl sm:text-4xl">Your certificate of completion</h1>
          <p className="mt-3 text-slate">
            Two things earn it: every required module finished, and {status.mattersNeeded}{' '}
            matters marked Good by a lawyer.
          </p>
          {profile.track === 'litigation_trainee' ? (
            <p className="mt-2 text-slate">
              Separately, your supervisor grades your programme work towards the firm&rsquo;s
              certification.
            </p>
          ) : null}
        </section>

        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg">Matters marked Good</h2>
            <span className="font-semibold tabular-nums">
              {matterSteps} of {status.mattersNeeded}
            </span>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {Array.from({ length: status.mattersNeeded }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 flex-1 rounded-full ${i < matterSteps ? 'bg-accent' : 'bg-paper-sunk'}`}
              />
            ))}
          </div>
          <Link href="/matters" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-2">
            Go to the matters
          </Link>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg">Required modules</h2>
          {status.requiredModules.length === 0 ? (
            <p className="text-sm text-slate">No required modules are open yet.</p>
          ) : (
            <ul className="space-y-2">
              {status.requiredModules.map((m) => (
                <li key={m.name} className="flex items-center justify-between gap-3 text-sm">
                  <span>{m.name}</span>
                  {m.complete ? (
                    <Pill tone="correct">Finished</Pill>
                  ) : (
                    <span className="text-muted tabular-nums">
                      {m.correctOnce} of {m.total}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link href="/modules" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-2">
            Go to the modules
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="eyebrow">Certificate</p>
        <PrintButton />
      </div>
      {profile.track === 'litigation_trainee' ? (
        <p className="text-sm text-slate print:hidden">
          Separately, your supervisor grades your programme work towards the firm&rsquo;s
          certification.
        </p>
      ) : null}

      <article className="certificate relative overflow-hidden rounded-2xl border-[10px] border-double border-accent/70 bg-[#fffdf8] px-6 py-12 text-center shadow-raised sm:px-14 sm:py-16">
        <span aria-hidden className="absolute inset-3 rounded-xl border border-accent/20" />
        <p className="text-[0.6875rem] font-semibold tracking-[0.3em] text-accent uppercase">
          {brand.fullName}
        </p>
        <h1 className="mt-6 text-4xl sm:text-5xl">Certificate of completion</h1>
        <p className="mt-8 text-slate">This is to record that</p>
        <p className="mt-3 font-serif text-3xl sm:text-4xl">{name}</p>
        <p className="mx-auto mt-6 max-w-lg text-slate">
          finished every required module of the {profile.country === 'MY' ? 'Malaysian' : 'Australian'}{' '}
          litigation training, and completed {status.mattersGood} practice{' '}
          {status.mattersGood === 1 ? 'matter' : 'matters'} marked Good by a supervising lawyer.
        </p>
        <div className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-2">
          {status.requiredModules.map((m) => (
            <span key={m.name} className="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-3 py-1 text-xs text-accent">
              <CheckIcon className="size-3" />
              {m.name}
            </span>
          ))}
        </div>
        <p className="mt-10 font-serif text-lg">Issued {longDate(status.issuedAt, profile.timezone)}</p>
        <p className="mx-auto mt-8 max-w-md text-[0.6875rem] text-muted">
          A training record from {brand.fullName}. It is not a professional qualification,
          practising certificate or admission.
        </p>
      </article>
    </div>
  );
}
