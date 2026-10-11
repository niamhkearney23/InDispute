import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui';
import { createServiceClient } from '@/lib/supabase/service';
import { pushConfigured } from '@/lib/push/service';
import { KeyMaker } from './key-maker';

export const metadata: Metadata = { title: 'Phones' };

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  });

/**
 * The academy on phones (0042): whether notifications are switched on for
 * this deployment, how many phones have them, when a round reminder last
 * went, and how to switch it all on without a terminal.
 *
 * An administrator's page, because it is about the deployment's settings.
 * It shows counts and dates only: never who, and never any key.
 */
export default async function PhonePage() {
  await requireAdmin();
  const db = createServiceClient();
  const configured = pushConfigured();
  const scheduled = (process.env.CRON_SECRET ?? '').length >= 24;

  const [{ data: devices }, { data: last }] = await Promise.all([
    db.from('push_devices').select('user_id').limit(5000),
    db.from('push_round_reminders').select('sent_at').order('sent_at', { ascending: false }).limit(1),
  ]);
  const phones = (devices ?? []).length;
  const people = new Set(((devices ?? []) as Array<{ user_id: string }>).map((d) => d.user_id)).size;
  const lastReminder = ((last ?? []) as Array<{ sent_at: string }>)[0]?.sent_at ?? null;

  const rows: Array<[string, string]> = [
    ['Notifications', configured ? 'Switched on' : 'Not set up yet'],
    ['Round reminder secret', scheduled ? 'Set' : 'Not set'],
    ['Phones with notifications on', `${phones} (${people} ${people === 1 ? 'person' : 'people'})`],
    ['Last round reminder', lastReminder ? `${when(lastReminder)}, Kuala Lumpur time` : 'None yet'],
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Phones</p>
        <h1 className="text-3xl sm:text-4xl">The academy on phones</h1>
        <p className="mt-3 max-w-xl text-slate">
          Anybody can put the academy on their home screen from their Account page. Notifications need the
          settings below, once, for this deployment.
        </p>
      </section>

      <Card>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-slate">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {configured && scheduled && !lastReminder ? (
          <p className="mt-4 text-sm text-slate">
            If a confirmed trainee has notifications on and a rounds morning has passed with no reminder, check
            step 3 below was run.
          </p>
        ) : null}
      </Card>

      <Card>
        <KeyMaker />
      </Card>
    </div>
  );
}
