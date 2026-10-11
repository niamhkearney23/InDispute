import type { Metadata } from 'next';
import { requireFirmAdmin } from '@/lib/admin/guard';
import { Card, Notice, buttonClasses } from '@/components/ui';
import { activeMonths, firmPeople } from '@/lib/reports/data';
import { monthName } from '@/lib/reports/rules';

export const metadata: Metadata = { title: 'Reports' };

const DOWNLOADS: Array<{ title: string; body: string; kind: string }> = [
  {
    title: 'Active people by month',
    body: 'What the firm is invoiced on: everyone active in each of the last twelve months, by name.',
    kind: 'active',
  },
  {
    title: 'Progress',
    body: 'Each person: homework days, rounds done and missed, work and matters marked Good, and their certificate.',
    kind: 'progress',
  },
  {
    title: 'Certification register',
    body: 'Each trainee in the register: competencies at the top grade, core ones still to show, and whether they are certified.',
    kind: 'register',
  },
];

/**
 * The firm's figures: who was active in each month, which is what the firm
 * is invoiced on, and the reports it can keep or send on, as spreadsheets
 * or branded PDFs. The firm's administrator's page, or an administrator's.
 */
export default async function ReportsPage() {
  await requireFirmAdmin();
  const people = await firmPeople();
  const months = await activeMonths(people);

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Reports</p>
        <h1 className="text-3xl">The firm’s figures</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Somebody counts as active in a month when they answered a question, ticked a day of
          homework, handed in work or started a practice matter in it, once however much they did.
          Only the firm’s own people are counted: confirmed trainees, people who took up an
          invitation, and people confirmed on an active code. {people.length}{' '}
          {people.length === 1 ? 'person is' : 'people are'} on the firm’s list now.
        </p>
      </section>

      <Card>
        <h2 className="text-lg">Active people by month</h2>
        {months ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs tracking-wide text-muted uppercase">
                  <th className="py-2 pr-4 font-semibold">Month</th>
                  <th className="py-2 text-right font-semibold">Active</th>
                </tr>
              </thead>
              <tbody>
                {[...months].reverse().map((m) => (
                  <tr key={m.month} className="border-b border-rule last:border-0">
                    <td className="py-2 pr-4">{monthName(m.month)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{m.people.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3">
            <Notice tone="warn">
              The figures could not be read just now. If the database has not had the latest update
              applied, run UPDATE.sql first.
            </Notice>
          </div>
        )}
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {DOWNLOADS.map((d) => (
          <Card key={d.kind}>
            <h2 className="text-lg">{d.title}</h2>
            <p className="mt-1 mb-4 text-sm text-slate">{d.body}</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/admin/reports/export/${d.kind}-pdf`}
                className={buttonClasses('accent')}
              >
                PDF
              </a>
              <a
                href={`/admin/reports/export/${d.kind}-csv`}
                className={buttonClasses('outline')}
              >
                Spreadsheet (CSV)
              </a>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
