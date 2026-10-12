import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { verifiedAal } from '@/lib/auth/two-step-server';
import {
  MAX_DEVICES,
  TWO_STEP_SETUP_PATH,
  canAddDevice,
  canRemoveDevice,
  codePathFor,
  isStaff,
  returnPath,
  setupPathFor,
  twoStepEnforced,
  verifiedFactors,
} from '@/lib/auth/two-step';
import { ButtonLink, Card, Notice } from '@/components/ui';
import { AddDevice, RemoveDevice } from './setup-form';

export const metadata: Metadata = { title: 'Two-step sign-in' };

function addedOn(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/**
 * Two-step sign-in: adding an authenticator app, a second one as a spare,
 * and what to do when a phone is lost. Staff are sent here by the staff
 * pages until they have one; for anybody else it is optional.
 */
export default async function TwoStepSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; added?: string; removed?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(TWO_STEP_SETUP_PATH)}`);

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  const { next, added, removed } = await searchParams;
  // Where to carry on to once a device is added: the staff page that sent
  // them here, or nowhere in particular.
  const back = next ? returnPath(next, TWO_STEP_SETUP_PATH) : null;
  const here = back ? setupPathFor(back) : TWO_STEP_SETUP_PATH;

  const staff = isStaff(profile);
  const enforced = twoStepEnforced();
  const devices = verifiedFactors(user.factors);
  const aal = devices.length > 0 ? await verifiedAal(user.id) : null;

  // Managing devices needs today's code once one exists; Supabase refuses
  // otherwise. Ask for it first and come straight back.
  if (devices.length > 0 && aal !== 'aal2') redirect(codePathFor(here));

  const count = devices.length;
  const mustAdd = staff && enforced && count === 0;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="text-3xl">Two-step sign-in</h1>
        <p className="mt-3 text-slate">
          After your password, you type a six-digit code from an app on your phone. Somebody who
          learns your password still cannot sign in as you without the phone.
        </p>
      </section>

      {mustAdd ? (
        <Notice tone="warn">
          Staff need this before the staff pages will open. You can see every learner&rsquo;s record
          and change what they are taught, so a password on its own is not enough. Setting it up
          takes about two minutes.
        </Notice>
      ) : null}

      {added === '1' ? (
        <Notice tone="good">
          Done. From now on you will be asked for a code each time you sign in.
        </Notice>
      ) : null}
      {removed === '1' ? <Notice tone="good">That device is removed.</Notice> : null}

      {count > 0 && back ? (
        <ButtonLink href={back} className="w-full sm:w-auto">
          Carry on
        </ButtonLink>
      ) : null}

      <Card>
        <p className="eyebrow mb-2">
          Your devices, {count} of {MAX_DEVICES}
        </p>
        {count === 0 ? (
          <p className="text-sm text-slate">
            {staff
              ? 'None yet.'
              : 'None yet. This is optional for you. Once it is on, you will be asked for a code each time you sign in.'}
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {devices.map((d) => {
              const name = d.friendly_name || 'Authenticator app';
              const when = addedOn(d.created_at);
              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words">{name}</p>
                    {when ? <p className="text-xs text-muted">Added {when}</p> : null}
                  </div>
                  {canRemoveDevice({ isStaff: staff, verifiedFactorCount: count, aal, enforced }) ? (
                    <RemoveDevice factorId={d.id} name={name} />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {staff && enforced && count === 1 ? (
          <p className="mt-3 text-xs text-muted">
            Staff keep at least one device. To change phones, add the new one first, then remove the
            old one.
          </p>
        ) : null}
      </Card>

      {canAddDevice({ verifiedFactorCount: count, aal }) ? (
        <Card>
          <p className="eyebrow mb-2">{count === 0 ? 'Set it up' : 'Add a spare'}</p>
          {count > 0 ? (
            <p className="mb-4 text-sm text-slate">
              A second device means losing one phone does not lock you out: a second phone, a tablet,
              or a password manager that keeps codes.
            </p>
          ) : null}
          <AddDevice next={back} second={count > 0} />
        </Card>
      ) : (
        <Notice tone="neutral">
          You have {MAX_DEVICES} devices, the most there can be. To replace one, remove it first.
        </Notice>
      )}

      <Card>
        <p className="eyebrow mb-2">If you lose your phone</p>
        <p className="text-sm text-slate">
          There are no backup codes, so a spare device is the best protection. If every device is
          lost, an administrator of this academy removes them for you. They:
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate">
          <li>Sign in at supabase.com/dashboard and open this academy&rsquo;s project.</li>
          <li>Choose Authentication in the left-hand menu, then Users.</li>
          <li>Find you by your email address and click your row.</li>
          <li>In the panel that opens, press Remove MFA factors, and confirm.</li>
        </ol>
        <p className="mt-3 text-sm text-slate">
          You then sign in with your password alone and set up the new phone here.
          {staff ? ' The staff pages bring you back to this page until you do.' : ''}
        </p>
      </Card>
    </div>
  );
}
