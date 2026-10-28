import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { notFound } from 'next/navigation';
import { requireReviewer } from '@/lib/admin/guard';
import { COURT_HIERARCHIES } from '@/content/seed/court-hierarchies';
import { essayTopic } from '@/content/seed/essay-topics';
import { studioExercise } from '@/content/studio/exercises';
import { DIMENSION_LABELS } from '@/lib/studio/rules';
import { maxims, referenceByKey, referenceHash } from '@/lib/content/wording';
import { currentReferenceSignOffs } from '@/lib/content/signoff';
import { CourtMap } from '@/components/court-map';
import { Card, Pill } from '@/components/ui';
import { ReferenceSignOffForm } from './sign-off-form';

export const metadata: Metadata = { title: 'Courts and essays' };
export const dynamic = 'force-dynamic';

/**
 * One court map, essay topic, set of rules or Advocacy Studio exercise laid
 * out flat for a reviewer, then (for a court map) as a learner would see it,
 * then the sign-off.
 */
export default async function AdminReferenceItemPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireReviewer();
  const { key } = await params;
  const item = referenceByKey(key);
  if (!item) notFound();
  const signOff = (await currentReferenceSignOffs()).get(item.key);
  const hierarchy = item.kind === 'courts' && item.country ? COURT_HIERARCHIES[item.country] : null;
  const topic = item.kind === 'essay' ? essayTopic(item.key.replace(/^essay-/, '')) : undefined;
  const rules = item.kind === 'maxims' ? maxims() : null;
  const studio = item.kind === 'studio' ? studioExercise(item.key.replace(/^studio-/, '')) : undefined;
  const byslug = new Map((hierarchy?.courts ?? []).map((c) => [c.slug, c]));
  const nameOf = (slug: string | null | undefined) =>
    slug ? (byslug.get(slug)?.name ?? slug) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <Link
          href="/admin/reference"
          className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink"
        >
          ← All court maps and essay topics
        </Link>
        <p className="eyebrow mt-2 mb-2">
          {item.country === 'MY' ? 'Malaysia' : item.country === 'AU' ? 'Australia' : 'Both countries'}
        </p>
        <h1 className="text-3xl">{item.title}</h1>
        <div className="mt-3">
          {signOff ? (
            <Pill tone="correct">
              Signed off by {signOff.name},{' '}
              {new Date(signOff.signedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Pill>
          ) : (
            <Pill tone="warn">Not signed off: learners do not see it</Pill>
          )}
        </div>
      </section>

      {hierarchy ? (
        <>
          <ol className="space-y-3">
            {hierarchy.courts.map((court) => (
              <li key={court.slug}>
                <Card>
                  <p className="font-medium">{court.name}</p>
                  {court.short && court.short !== court.name ? (
                    <p className="text-sm text-slate">Shown on a small screen as: {court.short}</p>
                  ) : null}
                  {court.note ? <p className="mt-2 leading-relaxed">{court.note}</p> : null}
                  <p className="mt-2 text-sm text-slate">
                    Row: {hierarchy.tierLabels[court.tier] ?? court.tier}. Appeals go to:{' '}
                    {court.appealsTo
                      ? [nameOf(court.appealsTo), nameOf(court.alsoAppealsTo)]
                          .filter(Boolean)
                          .join(', or ')
                      : 'nowhere, this is the top'}
                    .
                  </p>
                </Card>
              </li>
            ))}
          </ol>
          <Card>
            <p className="eyebrow mb-2">Under the map</p>
            <p>{hierarchy.legend}</p>
          </Card>
          <section>
            <h2 className="mb-3 text-xl">As a learner sees it</h2>
            <CourtMap hierarchy={hierarchy} quizHref={null} />
          </section>
        </>
      ) : topic ? (
        <Card>
          <p className="eyebrow mb-2">The topic, as a learner reads it</p>
          <p className="leading-relaxed">{topic.prompt}</p>
        </Card>
      ) : studio ? (
        <div className="space-y-5">
          <Card>
            <p className="eyebrow mb-2">The task</p>
            <p className="leading-relaxed">{studio.task}</p>
            <p className="mt-3 text-sm text-slate">
              Up to {studio.maxSeconds} seconds of recording. Language: {studio.language === 'en' ? 'English' : 'Malay'}.
            </p>
          </Card>
          {studio.facts.length ? (
            <Card>
              <p className="eyebrow mb-2">The facts</p>
              <ul className="list-disc space-y-2 pl-5 leading-relaxed">
                {studio.facts.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Card>
          ) : null}
          {studio.preparation.length ? (
            <Card>
              <p className="eyebrow mb-2">Before you start</p>
              <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
                {studio.preparation.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </Card>
          ) : null}
          <Card>
            <p className="eyebrow mb-2">Authorities the feedback may rely on</p>
            {studio.authorities.length ? (
              <ul className="space-y-2">
                {studio.authorities.map((a) => (
                  <li key={a.citation}>
                    <span className="font-medium">{a.citation}</span>
                    <span className="block text-slate">{a.proposition}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate">
                None. Legal reasoning is not assessed on this exercise, and the AI is told to say
                nothing about the law.
              </p>
            )}
          </Card>
          <Card>
            <p className="eyebrow mb-2">What the feedback measures</p>
            <dl className="space-y-3">
              {studio.rubric.map((c) => (
                <div key={c.dimension}>
                  <dt className="font-medium">{DIMENSION_LABELS[c.dimension]}</dt>
                  <dd className="text-slate">{c.criterion}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      ) : rules ? (
        <ol className="space-y-3">
          {rules.map((rule) => (
            <li key={rule.day}>
              <Card>
                <p className="eyebrow mb-1">
                  Rule {rule.day}: {rule.concept}
                </p>
                <p className="leading-relaxed">{rule.line}</p>
              </Card>
            </li>
          ))}
        </ol>
      ) : null}

      <section className="border-t border-rule pt-6">
        {signOff ? (
          <p className="text-sm text-slate">
            Signed off in this wording. If any of it changes, it comes back here to be signed again.
          </p>
        ) : (
          <ReferenceSignOffForm
            itemKey={item.key}
            hash={referenceHash(item)}
            confirmText={
              hierarchy
                ? 'I have read every court above, its note, the row it sits on and where its appeals go, and the law in it is correct.'
                : rules
                  ? 'I have read all twenty rules above, and what they say about the law and practice is correct.'
                  : studio
                    ? 'I have read the task, the facts, the preparation notes, the authorities and the rubric above. They are fit to give learners for practice, and anything they say about the law and practice is correct.'
                  : 'I have read the topic above, and what it says about the law is correct.'
            }
          />
        )}
      </section>
    </div>
  );
}
