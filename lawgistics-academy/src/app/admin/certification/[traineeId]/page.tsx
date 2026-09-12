import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import {
  bestGradePerBox,
  computeCertificationStatus,
  entriesForTrainee,
  getTrainee,
  GRADE_LABELS,
} from '@/lib/certification/service';
import {
  CERTIFICATION_BOXES,
  CERTIFICATION_BOXES_REQUIRED_COUNT,
} from '@/content/seed/certification-boxes';
import { Card, Notice, Pill, SectionHeading } from '@/components/ui';
import { saveCertificationEntry } from '../actions';
import { EntryForm } from '../entry-form';

export const metadata: Metadata = { title: 'Trainee' };
export const dynamic = 'force-dynamic';

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function TraineeDetailPage({
  params,
}: {
  params: Promise<{ traineeId: string }>;
}) {
  await requireCoach();
  const { traineeId } = await params;

  const trainee = await getTrainee(traineeId);
  if (!trainee) notFound();

  const [entries, user] = await Promise.all([entriesForTrainee(traineeId), getCurrentUser()]);
  const status = computeCertificationStatus(entries);
  const grid = bestGradePerBox(entries);

  const coachProfile = user ? await getLearnerProfile(user.id) : null;
  const coachName = coachProfile?.displayName ?? 'the supervising coach';

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">{trainee.firmName}</p>
            <h1 className="text-3xl">{trainee.fullName}</h1>
          </div>
          <Link
            href={`/admin/certification/${trainee.id}/edit`}
            className="rounded-[5px] border border-rule-strong px-3 py-2 text-sm text-slate hover:bg-paper-sunk hover:text-ink"
          >
            Edit trainee
          </Link>
        </div>
        {trainee.notes ? <p className="mt-2 max-w-2xl text-sm text-slate">{trainee.notes}</p> : null}
      </section>

      {status.certified ? (
        <Notice tone="good">
          <p className="mb-2 font-medium">Certified.</p>
          <textarea
            readOnly
            rows={4}
            className="w-full rounded-md border border-verdict-correct/25 bg-paper p-3 text-sm text-ink"
            value={`I certify that ${trainee.fullName} has, on live matters in the Magistrates'/Sessions Court, independently produced the 10 work products ticked above at filing-ready standard, including the fact-investigation, law-investigation and chronology spine and at least one advocacy product.\n\n${coachName}\n${longDate(new Date().toISOString().slice(0, 10))}`}
          />
        </Notice>
      ) : (
        <Notice tone="neutral">
          <p className="font-medium">
            {status.boxesAtL3.length} of {CERTIFICATION_BOXES_REQUIRED_COUNT} boxes at Level 3.
          </p>
          {status.missingSpineBoxes.length > 0 ? (
            <p className="mt-1">
              Still needed from the spine: box{status.missingSpineBoxes.length > 1 ? 'es' : ''}{' '}
              {status.missingSpineBoxes.join(', ')}.
            </p>
          ) : null}
          {!status.hasAdvocacyBox ? (
            <p className="mt-1">No advocacy box (11 to 15) at Level 3 yet.</p>
          ) : null}
        </Notice>
      )}

      <section>
        <SectionHeading eyebrow="Boxes" title="Where they stand" />
        <div className="grid gap-2 sm:grid-cols-2">
          {CERTIFICATION_BOXES.map((box) => {
            const grade = grid.get(box.number);
            return (
              <Card key={box.number} className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {box.number}. {box.workProduct}
                  </p>
                  {grade ? (
                    <Pill tone={grade === 'l3_independent' ? 'correct' : 'neutral'}>
                      {GRADE_LABELS[grade]}
                    </Pill>
                  ) : (
                    <Pill>Not attempted</Pill>
                  )}
                </div>
                <p className="text-xs text-muted">{box.cluster}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Register" title="Cases logged" />
        {entries.length === 0 ? (
          <p className="text-sm text-slate">Nothing logged yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <Pill>Box {entry.boxNumber}</Pill>
                      {entry.grade ? (
                        <Pill tone={entry.grade === 'l3_independent' ? 'correct' : 'neutral'}>
                          {GRADE_LABELS[entry.grade]}
                        </Pill>
                      ) : (
                        <Pill tone="warn">Not yet graded</Pill>
                      )}
                    </div>
                    <p className="text-sm font-medium">{entry.caseNo}</p>
                    <p className="text-sm text-slate">
                      {[entry.courtFileRef, entry.caseTypeStage].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      In {longDate(entry.dateIn)}
                      {entry.draftBack ? ` · back ${longDate(entry.draftBack)}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/admin/certification/${trainee.id}/entries/${entry.id}`}
                    className="rounded-[5px] border border-rule-strong px-3 py-2 text-sm text-slate hover:bg-paper-sunk hover:text-ink"
                  >
                    Edit
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="New" title="Log a case against a box" />
        <EntryForm
          action={saveCertificationEntry}
          submitLabel="Log it"
          initial={{
            traineeId: trainee.id,
            boxNumber: '',
            caseNo: '',
            courtFileRef: '',
            caseTypeStage: '',
            dateIn: new Date().toISOString().slice(0, 10),
            draftBack: '',
            grade: '',
            screeningConfirmed: false,
            note: '',
          }}
        />
      </section>
    </div>
  );
}
