import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { TRAINING_FILE } from '@/content/training-file';
import { ButtonLink, Card, Notice, SectionHeading } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'The training file' };

/**
 * The invented matter every trainee works through the month.
 *
 * Shown to trainees and to staff. Nothing on it is recorded, and the
 * coach's notes at the end are rendered only for a coach or an
 * administrator: they say what the file is built to test, which is the
 * one thing a trainee should not be handed.
 */
export default async function TrainingFilePage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');
  const staff = profile.isAdmin || profile.isCoach;
  if (profile.track !== 'litigation_trainee' && !staff) redirect('/dashboard');

  const file = TRAINING_FILE;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">The training file</p>
        <h1 className="text-3xl sm:text-4xl">{file.name}</h1>
        <p className="mt-3 text-slate">
          Everyone on the programme works this one matter through the month: the interview,
          the chronology, the pleadings, the application, the moot. Read it front to back
          once before you take a note.
        </p>
      </section>

      <Notice tone="warn">
        <strong>Invented for training.</strong> {file.fictional}
      </Notice>

      <section>
        <SectionHeading eyebrow="The client" title={file.client.name} />
        <Card>
          <p className="text-slate">{file.client.description}</p>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="First meeting" title="What the client said" />
        <Card>
          <div className="space-y-3 text-[0.9375rem] leading-relaxed">
            {file.instructions.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading eyebrow="In the file" title={`${file.documents.length} documents`} />
        <ol className="space-y-3">
          {file.documents.map((doc, index) => (
            <li key={doc.title}>
              <Card>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-serif text-lg leading-snug">
                    <span className="text-muted">{index + 1}. </span>
                    {doc.title}
                  </p>
                  <p className="text-sm text-muted">{doc.date}</p>
                </div>
                <p className="mt-0.5 text-sm text-slate">From: {doc.from}</p>
                <pre className="mt-3 overflow-x-auto rounded-md border border-rule bg-paper-sunk px-4 py-3 font-sans text-[0.875rem] leading-relaxed whitespace-pre-wrap">
                  {doc.body}
                </pre>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionHeading eyebrow="The people" title="Who you can speak to" />
        <div className="space-y-3">
          {file.people.map((person) => (
            <Card key={person.name}>
              <p className="font-serif text-lg leading-snug">{person.name}</p>
              <p className="text-sm text-slate">{person.role}</p>
              <p className="mt-2 text-sm">{person.brief}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          A lawyer plays each of them when you interview. The brief is what they know; what you
          find out depends on what you ask.
        </p>
      </section>

      {staff ? (
        <section>
          <SectionHeading eyebrow="For the coach" title="What the file is built to test" />
          <Card className="border-accent/20 bg-accent-wash">
            <ul className="space-y-2 text-sm">
              {file.coachNotes.map((note) => (
                <li key={note.slice(0, 30)}>{note}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Shown to coaches and administrators only. Trainees do not see this section.
            </p>
          </Card>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/programme" size="lg" variant="accent">
          The month, week by week
        </ButtonLink>
        <ButtonLink href="/dashboard" size="lg" variant="outline">
          Back to today
        </ButtonLink>
      </div>
    </div>
  );
}
