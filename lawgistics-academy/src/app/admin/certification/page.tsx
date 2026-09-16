import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { rosterWithStatus } from '@/lib/certification/service';
import { CERTIFICATION_BOXES_REQUIRED_COUNT } from '@/content/seed/certification-boxes';
import { ButtonLink, Card, EmptyState, Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Certification' };
export const dynamic = 'force-dynamic';

export default async function CertificationPage() {
  await requireCoach();
  const roster = await rosterWithStatus();

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Certification</p>
            <h1 className="text-3xl">Trainees</h1>
          </div>
          <ButtonLink href="/admin/certification/new" variant="accent">
            Add trainee
          </ButtonLink>
        </div>
        <p className="mt-3 max-w-2xl text-slate">
          Real trainees, on real live files. Ten boxes at Level 3, including every box
          in the spine and at least one advocacy box, is what certifies somebody. No
          case supplies more than two or three boxes, so certification only comes from
          several live files.
        </p>
      </section>

      {roster.length === 0 ? (
        <EmptyState
          title="Nobody on the register yet"
          description="Add a trainee, then log their first case against a box."
        />
      ) : (
        <ul className="space-y-3">
          {roster.map(({ trainee, status }) => (
            <Card as="li" key={trainee.id} className="list-none">
              <Link
                href={`/admin/certification/${trainee.id}`}
                className="-m-1 flex flex-wrap items-center justify-between gap-3 rounded-md p-1"
              >
                <div>
                  <h2 className="text-lg">{trainee.fullName}</h2>
                  <p className="text-sm text-slate">{trainee.firmName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={status.certified ? 'correct' : 'neutral'}>
                    {status.boxesAtL3.length} of {CERTIFICATION_BOXES_REQUIRED_COUNT}
                  </Pill>
                  {status.certified ? <Pill tone="correct">Certified</Pill> : null}
                </div>
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
