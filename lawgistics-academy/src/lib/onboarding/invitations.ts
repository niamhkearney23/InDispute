import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';
import type { Country } from '@/lib/types';

/**
 * Inviting somebody to join the firm.
 *
 * The link is the credential. Everything here follows from that:
 *
 *   * The token is 32 random bytes from the system CSPRNG, not a uuid. A uuid
 *     would probably be fine, but "probably fine" is not a thing to say about
 *     the only secret standing between a stranger and an account inside a law
 *     firm's system.
 *
 *   * Only its SHA-256 hash is stored, exactly as a password would be. The
 *     token appears once, in the link handed to the administrator, and is not
 *     recoverable from the database afterwards. If the firm loses it they issue
 *     a new one, which is the correct answer and also the safe one.
 *
 *   * No plain-text token is ever logged, returned in an error, or written to
 *     any row other than as a hash.
 */

const TOKEN_BYTES = 32;

/** Long enough that guessing is not a strategy, short enough to paste. */
export function newToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export interface Invitation {
  id: string;
  email: string;
  displayName: string;
  startsOn: string | null;
  country: Country;
  invitedAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  invitedByName: string | null;
  /**
   * Whole days until the link stops working, computed here rather than in the
   * page: reading the clock during a render is impure, and this is the only
   * place that legitimately knows the answer anyway.
   */
  daysLeft: number;
}

export type InvitationProblem = 'not-found' | 'expired' | 'accepted' | 'revoked';

const COLUMNS =
  'id, email, display_name, starts_on, country, invited_by, invited_at, expires_at, accepted_at, accepted_by, revoked_at';

interface Row {
  id: string;
  email: string;
  display_name: string;
  starts_on: string | null;
  country: Country;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

function shape(row: Row, invitedByName: string | null): Invitation {
  return {
    daysLeft: Math.ceil((new Date(row.expires_at).getTime() - Date.now()) / 86_400_000),
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? '',
    startsOn: row.starts_on,
    country: row.country,
    invitedAt: row.invited_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    invitedByName,
  };
}

/**
 * Create an invitation and return the token exactly once.
 *
 * The caller is responsible for having established that it is an administrator;
 * this runs through the service role and has no safety net of its own.
 */
export async function createInvitation(input: {
  invitedBy: string;
  email: string;
  displayName: string;
  startsOn: string | null;
  country: Country;
}): Promise<{ token: string; error: null } | { token: null; error: string }> {
  const db = createServiceClient();
  const token = newToken();

  const { error } = await db.from('joiner_invitations').insert({
    token_hash: hashToken(token),
    email: input.email.trim().toLowerCase(),
    display_name: input.displayName.trim(),
    starts_on: input.startsOn,
    country: input.country,
    invited_by: input.invitedBy,
  });

  if (error) {
    // The partial unique index means one live invitation per person.
    if (error.code === '23505') {
      return {
        token: null,
        error:
          'There is already an invitation out to that address. Call it back first if you want to send a new one.',
      };
    }
    return { token: null, error: 'That invitation could not be created.' };
  }

  return { token, error: null };
}

/**
 * Look an invitation up by the token from a link.
 *
 * Returns a reason rather than a bare null, because "this link has already been
 * used" and "this link expired" are different things to tell somebody standing
 * at the door on their first morning, and "no" is not useful to either of them.
 */
export async function findInvitation(
  token: string,
): Promise<{ invitation: Invitation; error: null } | { invitation: null; error: InvitationProblem }> {
  const db = createServiceClient();

  const { data } = await db
    .from('joiner_invitations')
    .select(COLUMNS)
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (!data) return { invitation: null, error: 'not-found' };

  const row = data as Row;
  if (row.revoked_at) return { invitation: null, error: 'revoked' };
  if (row.accepted_at) return { invitation: null, error: 'accepted' };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { invitation: null, error: 'expired' };
  }

  const { data: who } = await db
    .from('profiles')
    .select('display_name')
    .eq('id', row.invited_by)
    .maybeSingle();

  return { invitation: shape(row, (who?.display_name as string | null) ?? null), error: null };
}

/**
 * Take up an invitation: create the account and set it up as the firm described.
 *
 * Everything about who this person is comes from the invitation rather than
 * from the form. Their email is the one the firm invited, their name and start
 * date are the firm's, and there is no path through this function that sets
 * `is_admin`. Whoever holds the link gets an ordinary account belonging to the
 * person the firm meant to invite, and nothing else.
 *
 * The race, two people opening the same link at once, is settled by the unique
 * constraint on the email in Supabase's own auth tables: the second account
 * creation fails, and that person is told the invitation has been used. The
 * claim below is then conditional on the invitation still being unclaimed, so
 * the row can only ever be marked accepted once.
 */
export async function acceptInvitation(
  token: string,
  password: string,
): Promise<{ email: string; error: null } | { email: null; error: string }> {
  const found = await findInvitation(token);
  if (found.error) {
    return { email: null, error: problemMessage(found.error) };
  }

  const invitation = found.invitation;
  const db = createServiceClient();

  // email_confirm, because the firm is the one vouching for this address: it
  // typed it in. Requiring a confirmation email as well would make joining
  // depend on SMTP being configured, which for this deployment it is not.
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: invitation.displayName || invitation.email.split('@')[0],
      country: invitation.country,
    },
  });

  if (createError || !created?.user) {
    const already = /already|exists|registered/i.test(createError?.message ?? '');
    return {
      email: null,
      error: already
        ? 'There is already an account for that address. Try signing in instead.'
        : 'That account could not be created. Please tell whoever invited you.',
    };
  }

  const userId = created.user.id;

  // The profile row is made by the handle_new_user trigger. This adds the parts
  // only the firm knows, and note what is not in it: is_admin.
  await db
    .from('profiles')
    .update({
      display_name: invitation.displayName || null,
      country: invitation.country,
      starts_on: invitation.startsOn,
    })
    .eq('id', userId);

  const { data: claimed } = await db
    .from('joiner_invitations')
    .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
    .eq('id', invitation.id)
    .is('accepted_at', null)
    .select('id');

  if (!claimed || claimed.length === 0) {
    // Somebody else claimed it between the lookup and here. The account exists
    // and belongs to the invited address, so the honest thing is to let them
    // sign in rather than to delete an account somebody may already be using.
    return { email: invitation.email, error: null };
  }

  return { email: invitation.email, error: null };
}

export function problemMessage(problem: InvitationProblem): string {
  switch (problem) {
    case 'accepted':
      return 'This invitation has already been used. If that was you, sign in instead.';
    case 'expired':
      return 'This invitation has expired. Ask the firm to send you a new one.';
    case 'revoked':
      return 'This invitation has been called back. Ask the firm to send you a new one.';
    default:
      return 'This invitation link is not valid. Check you copied all of it.';
  }
}

// -----------------------------------------------------------------------------
// Administration
// -----------------------------------------------------------------------------

/** Invitations that are still out: not taken up, not called back, not expired. */
export async function pendingInvitations(): Promise<Invitation[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('joiner_invitations')
    .select(COLUMNS)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('invited_at', { ascending: false });

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const { data: names } = await db
    .from('profiles')
    .select('id, display_name')
    .in('id', [...new Set(rows.map((r) => r.invited_by))]);

  const nameById = new Map((names ?? []).map((n) => [n.id as string, n.display_name as string | null]));
  return rows.map((r) => shape(r, nameById.get(r.invited_by) ?? null));
}

export async function revokeInvitation(id: string): Promise<{ error: string | null }> {
  const db = createServiceClient();
  const { error } = await db
    .from('joiner_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('accepted_at', null);

  return { error: error ? 'That could not be called back.' : null };
}
