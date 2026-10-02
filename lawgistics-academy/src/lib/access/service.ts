import 'server-only';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentUser } from '@/lib/supabase/server';
import { accessReason, subscriptionLive, type AccessReason } from './rules';

/**
 * Whether people are asked to pay. Off unless the deployment says PAYMENTS=on
 * and has a Stripe key: until then everybody is in, exactly as before, and
 * the pricing page says nothing is charged yet.
 */
export function paymentsOn(): boolean {
  return process.env.PAYMENTS === 'on' && Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface AccessState {
  reason: AccessReason | null;
  /** The code they entered, if any, and what has been decided about it. */
  request: { label: string; decision: 'confirmed' | 'declined' | null; codeActive: boolean } | null;
  subscription: {
    status: string | null;
    periodEnd: string | null;
    customerId: string | null;
  } | null;
}

/**
 * Everything that decides whether somebody is in. Read with the service
 * client, so callers must already know who is asking: every caller passes
 * the id of the signed-in user, never one from a form.
 */
export async function accessFor(userId: string): Promise<AccessState> {
  const db = createServiceClient();
  const [{ data: profile }, { data: invitation }, { data: grant }, { data: sub }] =
    await Promise.all([
      db
        .from('profiles')
        .select('is_admin, is_coach, trainee_approved_at')
        .eq('id', userId)
        .maybeSingle(),
      db.from('joiner_invitations').select('id').eq('accepted_by', userId).limit(1).maybeSingle(),
      db
        .from('access_grants')
        .select('decision, access_codes(label, active)')
        .eq('user_id', userId)
        .maybeSingle(),
      db
        .from('subscriptions')
        .select('status, current_period_end, stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

  const code = (grant?.access_codes ?? null) as { label: string; active: boolean } | null;
  const decision = (grant?.decision ?? null) as 'confirmed' | 'declined' | null;

  return {
    reason: accessReason({
      paymentsOn: paymentsOn(),
      isStaff: Boolean(profile?.is_admin || profile?.is_coach),
      traineeConfirmed: Boolean(profile?.trainee_approved_at),
      joinedByInvitation: Boolean(invitation),
      // Turning a code off ends it for everybody on it, not only new people:
      // that is what a firm leaving looks like.
      firmConfirmed: decision === 'confirmed' && Boolean(code?.active),
      paid: subscriptionLive(
        (sub?.status as string | null) ?? null,
        (sub?.current_period_end as string | null) ?? null,
        new Date(),
      ),
    }),
    request: grant && code ? { label: code.label, decision, codeActive: code.active } : null,
    subscription: sub
      ? {
          status: (sub.status as string | null) ?? null,
          periodEnd: (sub.current_period_end as string | null) ?? null,
          customerId: (sub.stripe_customer_id as string | null) ?? null,
        }
      : null,
  };
}

/** True when this person may use the training. */
export async function hasAccess(userId: string): Promise<boolean> {
  if (!paymentsOn()) return true;
  return (await accessFor(userId)).reason !== null;
}

/**
 * For the top of every learner page that is training: somebody who has not
 * paid and is not with a firm is sent to the pricing page. Pages that must
 * stay open to them (their account, the pricing page, setting up their
 * profile) do not call it, and a test holds every other page to it.
 */
export async function requireAccess(): Promise<void> {
  if (!paymentsOn()) return;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await hasAccess(user.id))) redirect('/pricing');
}

export interface WaitingRequest {
  userId: string;
  name: string;
  email: string | null;
  label: string;
  requestedAt: string;
}

/**
 * People who entered a firm's code and are waiting for somebody there to
 * confirm them. Callers are staff pages, behind requireCoach.
 */
export async function waitingForAccess(): Promise<WaitingRequest[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('access_grants')
    .select('user_id, requested_at, access_codes!inner(label, active)')
    .is('decision', null)
    .eq('access_codes.active', true)
    .order('requested_at', { ascending: true });
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: people } = await db
    .from('profiles')
    .select('id, display_name, email')
    .in(
      'id',
      rows.map((r) => r.user_id as string),
    );
  const byId = new Map((people ?? []).map((p) => [p.id as string, p]));

  return rows.map((r) => {
    const person = byId.get(r.user_id as string);
    const code = r.access_codes as unknown as { label: string };
    return {
      userId: r.user_id as string,
      name:
        (person?.display_name as string | null) || (person?.email as string | null) || 'Someone',
      email: (person?.email as string | null) ?? null,
      label: code.label,
      requestedAt: r.requested_at as string,
    };
  });
}

export interface AccessCodeRow {
  id: string;
  code: string;
  label: string;
  active: boolean;
  confirmed: number;
}

/** Every code, with how many people it has confirmed. Administrators only. */
export async function accessCodes(): Promise<AccessCodeRow[]> {
  const db = createServiceClient();
  const [{ data: codes }, { data: grants }] = await Promise.all([
    db
      .from('access_codes')
      .select('id, code, label, active')
      .order('created_at', { ascending: true }),
    db.from('access_grants').select('code_id').eq('decision', 'confirmed'),
  ]);
  const counts = new Map<string, number>();
  for (const g of grants ?? []) {
    counts.set(g.code_id as string, (counts.get(g.code_id as string) ?? 0) + 1);
  }
  return (codes ?? []).map((c) => ({
    id: c.id as string,
    code: c.code as string,
    label: c.label as string,
    active: Boolean(c.active),
    confirmed: counts.get(c.id as string) ?? 0,
  }));
}
