import { checkFirmAdmin } from '@/lib/admin/guard';
import { brand } from '@/lib/brand';
import { activeMonths, firmPeople, progressFor, registerRows } from '@/lib/reports/data';
import { Report, downloadHeaders } from '@/lib/reports/pdf';
import { fileSlug, monthName, toCsv } from '@/lib/reports/rules';
import { SPINE_BOX_NUMBERS, CERTIFICATION_BOXES } from '@/content/seed/certification-boxes';

/**
 * The firm's reports as files: active people per month (what a firm is
 * invoiced on), each person's progress, and the certification register, as
 * CSV or as a branded PDF. An administrator's or the firm's administrator's,
 * checked here before anything is read, because a route handler is a public
 * address like any server action.
 */

export const dynamic = 'force-dynamic';

const KINDS = ['active-csv', 'active-pdf', 'progress-csv', 'progress-pdf', 'register-csv', 'register-pdf'] as const;
type Kind = (typeof KINDS)[number];

const today = () => new Date().toISOString().slice(0, 10);
const file = (what: string, ext: string) => `${fileSlug(brand.fullName)}-${what}-${today()}.${ext}`;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const roundsText = (r: { done: number; missed: number; counted: number } | null) =>
  r ? `${r.done} of ${r.counted}` : '';

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const staffId = await checkFirmAdmin();
  if (!staffId) return new Response('Not authorised.', { status: 403 });
  const { kind } = await params;
  if (!KINDS.includes(kind as Kind)) return new Response('Not found.', { status: 404 });

  if (kind === 'active-csv' || kind === 'active-pdf') {
    const people = await firmPeople();
    const months = await activeMonths(people);
    if (!months) {
      return new Response('The figures could not be read. If the database has not had the latest update applied, run UPDATE.sql first.', { status: 503 });
    }
    const names = new Map(people.map((p) => [p.id, p]));
    if (kind === 'active-csv') {
      const rows = months.flatMap((m) =>
        m.people.map((id) => [m.month, names.get(id)?.name ?? id, names.get(id)?.email ?? '', names.get(id)?.role ?? '', names.get(id)?.cohort ?? '']),
      );
      const totals = months.map((m) => [m.month, `Total: ${m.people.length}`, '', '', '']);
      return new Response(toCsv(['Month', 'Name', 'Email', 'Role', 'Cohort'], [...totals, ...rows]), {
        headers: downloadHeaders(file('active-by-month', 'csv'), 'text/csv; charset=utf-8'),
      });
    }
    const report = await Report.start(
      'Active people by month',
      'Somebody counts for a month when they answered a question, ticked a day of homework, handed in work or started a practice matter in it, once however much they did. People the firm supervises only: confirmed trainees, people who took up an invitation, and people confirmed on an active code.',
    );
    report.table(
      [
        { label: 'Month', share: 0.6 },
        { label: 'Active', share: 0.4, align: 'right' },
      ],
      months.map((m) => [monthName(m.month), m.people.length]),
    );
    for (const m of [...months].reverse().filter((m) => m.people.length > 0)) {
      report.heading(monthName(m.month));
      report.table(
        [
          { label: 'Name', share: 0.4 },
          { label: 'Email', share: 0.35 },
          { label: 'Role', share: 0.25 },
        ],
        m.people.map((id) => [names.get(id)?.name ?? id, names.get(id)?.email ?? '', names.get(id)?.role ?? '']),
      );
    }
    return new Response(Buffer.from(await report.finish()), {
      headers: downloadHeaders(file('active-by-month', 'pdf'), 'application/pdf'),
    });
  }

  if (kind === 'progress-csv' || kind === 'progress-pdf') {
    const progress = await progressFor(await firmPeople());
    if (kind === 'progress-csv') {
      return new Response(
        toCsv(
          ['Name', 'Email', 'Role', 'Cohort', 'Starts', 'Ends', 'Homework days', 'Rounds done', 'Rounds missed', 'Work handed in', 'Work marked Good', 'Matters marked Good', 'Certificate issued'],
          progress.map((p) => [
            p.person.name,
            p.person.email,
            p.person.role,
            p.person.cohort,
            p.person.startsOn,
            p.person.endsOn,
            p.homeworkDays,
            p.rounds?.done ?? '',
            p.rounds?.missed ?? '',
            p.workHandedIn,
            p.workGood,
            p.mattersGood,
            p.certificateIssued?.slice(0, 10) ?? '',
          ]),
        ),
        { headers: downloadHeaders(file('progress', 'csv'), 'text/csv; charset=utf-8') },
      );
    }
    const report = await Report.start(
      'Progress',
      'Each person the firm supervises: homework days ticked, rounds done of the rounds counted so far, work handed in and marked Good, practice matters marked Good, and the certificate of completion when issued.',
    );
    report.table(
      [
        { label: 'Name', share: 0.24 },
        { label: 'Role', share: 0.15 },
        { label: 'Homework', share: 0.11, align: 'right' },
        { label: 'Rounds', share: 0.12, align: 'right' },
        { label: 'Work good', share: 0.12, align: 'right' },
        { label: 'Matters good', share: 0.12, align: 'right' },
        { label: 'Certificate', share: 0.14 },
      ],
      progress.map((p) => [
        p.person.name,
        p.person.role,
        `${p.homeworkDays} ${p.homeworkDays === 1 ? 'day' : 'days'}`,
        roundsText(p.rounds),
        `${p.workGood} of ${p.workHandedIn}`,
        p.mattersGood,
        p.certificateIssued ? p.certificateIssued.slice(0, 10) : 'Not yet',
      ]),
    );
    return new Response(Buffer.from(await report.finish()), {
      headers: downloadHeaders(file('progress', 'pdf'), 'application/pdf'),
    });
  }

  const register = await registerRows();
  if (kind === 'register-csv') {
    return new Response(
      toCsv(
        ['Trainee', 'Firm', 'Competencies at the top grade', 'Core competencies still to show', 'Advocacy shown', 'Certified'],
        register.map((r) => [r.name, r.firm, r.boxesAtTopGrade, r.coreMissing.join(' '), yesNo(r.advocacy), yesNo(r.certified)]),
      ),
      { headers: downloadHeaders(file('certification-register', 'csv'), 'text/csv; charset=utf-8') },
    );
  }
  const report = await Report.start(
    'Certification register',
    `Graded by the supervising lawyer against ${CERTIFICATION_BOXES.length} competencies. Certification needs 10 at the top grade (Independent), including all ${SPINE_BOX_NUMBERS.length} core ones and at least one in advocacy.`,
  );
  report.table(
    [
      { label: 'Trainee', share: 0.28 },
      { label: 'Firm', share: 0.2 },
      { label: 'Top grade', share: 0.13, align: 'right' },
      { label: 'Core to show', share: 0.15 },
      { label: 'Advocacy', share: 0.12 },
      { label: 'Certified', share: 0.12 },
    ],
    register.map((r) => [
      r.name,
      r.firm,
      `${r.boxesAtTopGrade} of ${CERTIFICATION_BOXES.length}`,
      r.coreMissing.length ? r.coreMissing.join(', ') : 'None',
      yesNo(r.advocacy),
      yesNo(r.certified),
    ]),
  );
  return new Response(Buffer.from(await report.finish()), {
    headers: downloadHeaders(file('certification-register', 'pdf'), 'application/pdf'),
  });
}
