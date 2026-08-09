import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { listStepsForAdmin } from '@/lib/onboarding/service';
import { brand } from '@/lib/brand';
import { ButtonLink, InlineLink, Notice } from '@/components/ui';
import { InviteForm } from './invite-form';

export const metadata: Metadata = { title: 'Invite somebody' };

export default async function InvitePage() {
  await requireAdmin();

  const steps = await listStepsForAdmin();
  const published = steps.filter((s) => s.published && s.required);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <p className="eyebrow mb-2">Joiners</p>
        <h1 className="text-3xl">Invite somebody to join</h1>
        <p className="mt-3 text-slate">
          They get a link, set a password, and land straight on their list. Their name,
          address and start date come from what you enter here, so there is nothing for
          them to fill in and nothing for them to get wrong.
        </p>
      </section>

      {published.length === 0 ? (
        <Notice tone="warn">
          <strong>There is nothing on the checklist yet.</strong> Somebody invited now would
          sign in to an empty list.{' '}
          <InlineLink href="/admin/onboarding/steps/new">Add the first item</InlineLink>
        </Notice>
      ) : (
        <Notice>
          They will see {published.length} required{' '}
          {published.length === 1 ? 'item' : 'items'} on their list when they sign in.
        </Notice>
      )}

      <InviteForm />

      <section className="border-t border-rule pt-6">
        <p className="text-sm text-slate">
          {brand.fullName} does not send the email itself, because this deployment has no
          mail server configured and a joining process that quietly depended on one would
          fail on the day it mattered. You get the link and send it however you normally
          write to somebody who is about to start.
        </p>
      </section>

      <div>
        <ButtonLink href="/admin/onboarding" variant="outline">
          Back to joiners
        </ButtonLink>
      </div>
    </div>
  );
}
