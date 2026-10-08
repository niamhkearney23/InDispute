import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { Card, Pill } from '@/components/ui';
import { staffList } from '@/lib/admin/staff';
import { StaffRoleForm } from './forms';

export const metadata: Metadata = { title: 'Staff' };

/**
 * Who runs this copy of the academy, and giving somebody a role. An
 * administrator's page: deciding who has staff rights is not something a
 * firm administrator does for themselves or anybody else.
 */
export default async function StaffPage() {
  await requireAdmin();
  const staff = await staffList();

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Staff</p>
        <h1 className="text-3xl">Who runs the academy</h1>
        <p className="mt-3 max-w-2xl text-slate">
          A <strong className="font-medium text-ink">firm administrator</strong> runs the firm’s
          people: invitations, confirming trainees, the joining checklist, codes, programme dates,
          the work board and the firm’s figures. They cannot write, publish or sign off content. A{' '}
          <strong className="font-medium text-ink">coach</strong> is a lawyer who signs content off,
          marks work and supervises. Somebody can be both.
        </p>
      </section>

      <Card>
        <h2 className="text-lg">Give somebody a role</h2>
        <p className="mt-1 mb-5 text-sm text-slate">
          They must sign up first with their own email address, so everything they record is under
          their own name.
        </p>
        <StaffRoleForm />
      </Card>

      <Card>
        <h2 className="text-lg">Staff now</h2>
        {staff.length === 0 ? (
          <p className="mt-3 text-sm text-slate">Nobody yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-rule">
            {staff.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words">{s.name}</p>
                  <p className="text-sm break-all text-slate">{s.email ?? 'No email'}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.isAdmin ? <Pill tone="accent">Administrator</Pill> : null}
                  {s.isFirmAdmin ? <Pill>Firm administrator</Pill> : null}
                  {s.isCoach ? <Pill>Coach</Pill> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
