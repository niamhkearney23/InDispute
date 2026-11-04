import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireCoach } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { greeting, greetingName } from '@/lib/greeting';
import { markingKindsFor, sectionsFor, type SectionKey, type StaffRoles } from '@/lib/admin/today';
import {
  ContentSection,
  OperationsSection,
  PeopleSection,
  SectionLoading,
  TeachingSection,
  TraineesSection,
  WorkSection,
} from './sections';

export const metadata: Metadata = { title: 'Today' };
export const dynamic = 'force-dynamic';

const KL = 'Asia/Kuala_Lumpur';

const TITLES: Record<SectionKey, string> = {
  work: 'Work awaiting feedback',
  trainees: 'Trainees needing attention',
  teaching: "Today's teaching",
  people: 'People awaiting confirmation',
  content: 'Content awaiting review',
  operations: 'Operational problems',
};

/**
 * Admin Today: the first screen for staff (the owner, November 2026: "an
 * Admin Today page that tells you and Mathew what needs attention"). It
 * brings the supervision loop together: the coach sets work, the learner
 * hands it in, the coach marks it, the learner has another go, and progress
 * records it. Every line links to the page where the thing is done; nothing
 * here writes anything.
 *
 * What a person sees, and in which order, follows their role
 * (`sectionsFor`): a coach lands on marking, trainees and teaching; a firm
 * administrator on people and the intake; an administrator on content and
 * operations as well. Each section streams in on its own.
 */
export default async function AdminTodayPage() {
  const { userId } = await requireCoach();
  const me = await getLearnerProfile(userId);
  const roles: StaffRoles = {
    admin: Boolean(me?.isAdmin),
    coach: Boolean(me?.isCoach),
    firmAdmin: Boolean(me?.isFirmAdmin),
  };
  const sections = sectionsFor(roles);
  const now = new Date();
  const name = greetingName(me?.displayName);

  const section = (key: SectionKey) => {
    switch (key) {
      case 'work':
        return <WorkSection kinds={markingKindsFor(roles)} />;
      case 'trainees':
        return <TraineesSection />;
      case 'teaching':
        return <TeachingSection />;
      case 'people':
        return <PeopleSection />;
      case 'content':
        return <ContentSection roles={roles} />;
      case 'operations':
        return <OperationsSection placement="inline" />;
    }
  };

  return (
    <div className="space-y-9">
      <header>
        <p className="eyebrow mb-1.5">
          {new Intl.DateTimeFormat('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: KL,
          }).format(now)}
        </p>
        <h1 className="text-3xl leading-tight sm:text-4xl">
          {greeting(now, KL)}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="mt-2 max-w-xl text-slate">
          What needs you today, most pressing first. Each line opens the page where it is done.
        </p>
      </header>

      {/* Something wrong with the running of the academy goes above everything. */}
      {sections.includes('operations') ? (
        <Suspense fallback={null}>
          <OperationsSection placement="top" />
        </Suspense>
      ) : null}

      {sections.map((key) => (
        <Suspense key={key} fallback={key === 'operations' ? null : <SectionLoading title={TITLES[key]} />}>
          {section(key)}
        </Suspense>
      ))}
    </div>
  );
}
