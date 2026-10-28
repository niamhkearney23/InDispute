import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { requireReviewer } from '@/lib/admin/guard';
import { REFERENCE_ITEMS } from '@/lib/content/wording';
import { currentReferenceSignOffs } from '@/lib/content/signoff';
import { Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Courts and essays' };
export const dynamic = 'force-dynamic';

/**
 * The legal reference content that lives in the code rather than the
 * question bank: each country's court map and the comparison essay topics.
 * None of it reaches a learner until a lawyer signs it off here (0046).
 */
export default async function AdminReferencePage() {
  await requireReviewer();
  const signed = await currentReferenceSignOffs();
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const waiting = REFERENCE_ITEMS.filter((item) => !signed.has(item.key)).length;

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Courts and essays</p>
        <h1 className="text-3xl">Court maps and essay topics to sign off</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Each country&rsquo;s court map (every court, what it does and where its appeals go) and
          the comparison essay topics, the sign-in page rules and the Advocacy Studio exercises.
          Learners see one only once a lawyer has read it and signed it off here, in Australia and
          Malaysia alike. Changing any word afterwards takes it away
          from learners until it is signed again.
          {waiting > 0 ? ` ${waiting} ${waiting === 1 ? 'is' : 'are'} waiting.` : ''}
        </p>
      </section>

      <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
        {REFERENCE_ITEMS.map((item) => {
          const signOff = signed.get(item.key);
          return (
            <li key={item.key}>
              <Link
                href={`/admin/reference/${item.key}`}
                className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-sunk"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{item.title}</span>
                  <span className="text-sm text-slate">
                    {item.country === 'MY'
                      ? 'Malaysia'
                      : item.country === 'AU'
                        ? 'Australia'
                        : 'Both countries'}
                  </span>
                </span>
                <span className="shrink-0">
                  {signOff ? (
                    <Pill tone="correct">
                      Signed off by {signOff.name}, {day(signOff.signedAt)}
                    </Pill>
                  ) : (
                    <Pill tone="warn">Waiting: not shown to learners</Pill>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
