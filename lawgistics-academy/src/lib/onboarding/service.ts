import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { listFirmModulesForLearner } from '@/lib/firm/service';
import { awaitingFirm, settles, type FirmStepKind } from '@/lib/onboarding/rules';
import type { Country } from '@/lib/types';

/**
 * Before you begin.
 *
 * A person joins the firm on a date. Before that date they have to have read
 * some things, signed some things, and had some things set up for them, and
 * somebody at the firm has to have checked. This module is that list and that
 * check, and nothing else.
 *
 * The one idea worth holding on to: this code never concludes that anybody is
 * ready. It counts what is outstanding and it shows the count to a supervisor,
 * who decides. Everything here is arranged so that the decision has a name and
 * a date on it, and so that a decision taken with items still outstanding still
 * looks, afterwards, exactly like what it was.
 */

export type { FirmStepKind };

export interface FirmStep {
  id: string;
  slug: string;
  title: string;
  detail: string;
  kind: FirmStepKind;
  /** Set for a read step, null otherwise. The content lives in firm_modules. */
  firmModuleId: string | null;
  /** Whether the firm has to confirm this over and above the person saying so. */
  needsFirmCheck: boolean;
  country: Country | null;
  required: boolean;
  position: number;
  published: boolean;
}

export interface LearnerStep extends FirmStep {
  /** For a read step: where to send them, and what it is called. */
  moduleSlug: string | null;
  moduleName: string | null;
  /** When this person said they had done it, or acknowledged the module. */
  declaredAt: string | null;
  /** When the firm confirmed it. Null on steps that need no confirmation. */
  confirmedAt: string | null;
  /** Whether it counts as finished. See `settles` for what that means per kind. */
  done: boolean;
  /** Said done by them, still waiting on the firm. The supervisor's worklist. */
  awaitingFirm: boolean;
}

export type DecisionKind = 'cleared' | 'withdrawn';

export interface OnboardingDecision {
  decision: DecisionKind;
  decidedAt: string;
  decidedBy: string;
  decidedByName: string | null;
  outstandingCount: number;
  note: string;
}

export interface BeforeYouBegin {
  startsOn: string | null;
  steps: LearnerStep[];
  /** Required steps not yet done. What the whole page is counting down. */
  outstanding: LearnerStep[];
  /** The most recent decision, which is the current state. */
  decision: OnboardingDecision | null;
  cleared: boolean;
}

const STEP_COLUMNS =
  'id, slug, title, detail, kind, firm_module_id, needs_firm_check, country, required, position, published';

interface StepRow {
  id: string;
  slug: string;
  title: string;
  detail: string;
  kind: FirmStepKind;
  firm_module_id: string | null;
  needs_firm_check: boolean;
  country: Country | null;
  required: boolean;
  position: number;
  published: boolean;
}

function shape(row: StepRow): FirmStep {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    detail: row.detail ?? '',
    kind: row.kind,
    firmModuleId: row.firm_module_id,
    needsFirmCheck: row.needs_firm_check,
    country: row.country,
    required: row.required,
    position: row.position,
    published: row.published,
  };
}

async function decisionFor(userId: string): Promise<OnboardingDecision | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('onboarding_decisions')
    .select('decision, decided_at, decided_by, outstanding_count, note')
    .eq('user_id', userId)
    .order('decided_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: who } = await db
    .from('profiles')
    .select('display_name')
    .eq('id', data.decided_by as string)
    .maybeSingle();

  return {
    decision: data.decision as DecisionKind,
    decidedAt: data.decided_at as string,
    decidedBy: data.decided_by as string,
    decidedByName: (who?.display_name as string | null) ?? null,
    outstandingCount: data.outstanding_count as number,
    note: (data.note as string) ?? '',
  };
}

/**
 * The whole checklist for one person, with the state of each item.
 */
export async function beforeYouBegin(
  userId: string,
  country: Country,
): Promise<BeforeYouBegin> {
  const db = createServiceClient();

  const [{ data: rows }, { data: profile }, decision] = await Promise.all([
    db
      .from('firm_steps')
      .select(STEP_COLUMNS)
      .eq('published', true)
      .or(`country.is.null,country.eq.${country}`)
      .order('position'),
    db.from('profiles').select('starts_on').eq('id', userId).maybeSingle(),
    decisionFor(userId),
  ]);

  const steps = (rows ?? []).map((r) => shape(r as StepRow));
  const startsOn = (profile?.starts_on as string | null) ?? null;

  if (steps.length === 0) {
    return { startsOn, steps: [], outstanding: [], decision, cleared: decision?.decision === 'cleared' };
  }

  const stepIds = steps.map((s) => s.id);

  const [{ data: declarations }, { data: confirmations }, modules] = await Promise.all([
    db
      .from('firm_step_declarations')
      .select('firm_step_id, declared_at')
      .eq('user_id', userId)
      .in('firm_step_id', stepIds),
    db
      .from('firm_step_confirmations')
      .select('firm_step_id, confirmed_at')
      .eq('user_id', userId)
      .in('firm_step_id', stepIds),
    // Reuses 0007 wholesale, including its country filter and its rule that a
    // module with no content is not shown to anybody.
    listFirmModulesForLearner(userId, country),
  ]);

  const declaredBy = new Map(
    (declarations ?? []).map((d) => [d.firm_step_id as string, d.declared_at as string]),
  );
  const confirmedBy = new Map(
    (confirmations ?? []).map((c) => [c.firm_step_id as string, c.confirmed_at as string]),
  );
  const moduleById = new Map(modules.map((m) => [m.id, m]));

  const resolved: LearnerStep[] = steps
    .map((step) => {
      const found = step.firmModuleId ? moduleById.get(step.firmModuleId) : undefined;

      // A read step takes its date from the acknowledgement, not from a
      // declaration row: 0007 already holds that fact and holds it against a
      // version, which is the stronger record of the two.
      const declaredAt =
        step.kind === 'read'
          ? (found?.acknowledgedAt ?? null)
          : (declaredBy.get(step.id) ?? null);

      const confirmedAt = step.kind === 'read' ? null : (confirmedBy.get(step.id) ?? null);

      return {
        ...step,
        moduleSlug: found?.slug ?? null,
        moduleName: found?.name ?? null,
        declaredAt,
        confirmedAt,
        done: settles(step.kind, step.needsFirmCheck, declaredAt, confirmedAt),
        awaitingFirm: awaitingFirm(step.kind, step.needsFirmCheck, declaredAt, confirmedAt),
      };
    })
    // A read step pointing at a module that is unpublished, empty, or scoped to
    // the other country has nothing behind it. Showing it would be an item
    // nobody could ever complete.
    .filter((step) => step.kind !== 'read' || step.moduleSlug !== null);

  return {
    startsOn,
    steps: resolved,
    outstanding: resolved.filter((s) => s.required && !s.done),
    decision,
    cleared: decision?.decision === 'cleared',
  };
}

/**
 * Record that this person says they have done a step.
 *
 * Not available for a read step: those are completed by reading the module and
 * acknowledging it, and a shortcut that let somebody tick "I have read the
 * ethics policy" without opening it would quietly remove the only thing the
 * record is worth.
 */
export async function declareStep(
  userId: string,
  country: Country,
  slug: string,
): Promise<{ error: string | null }> {
  const { steps } = await beforeYouBegin(userId, country);
  const step = steps.find((s) => s.slug === slug);

  if (!step) return { error: 'That item could not be found.' };
  if (step.kind === 'read') {
    return { error: 'Open the document and confirm at the end of it.' };
  }
  if (step.declaredAt) return { error: null };

  const db = createServiceClient();
  const { error } = await db
    .from('firm_step_declarations')
    .insert({ user_id: userId, firm_step_id: step.id });

  // Already there is the outcome that was asked for.
  if (error && error.code !== '23505') {
    return { error: 'That could not be recorded. Please try again.' };
  }
  return { error: null };
}

// -----------------------------------------------------------------------------
// Oversight
// -----------------------------------------------------------------------------

export interface RosterEntry {
  userId: string;
  displayName: string | null;
  email: string | null;
  startsOn: string | null;
  requiredCount: number;
  doneCount: number;
  outstandingCount: number;
  /** Items they have declared that the firm has not confirmed. */
  awaitingFirmCount: number;
  cleared: boolean;
  decision: OnboardingDecision | null;
}

/**
 * Everybody, in the order somebody overseeing this would want them.
 *
 * Sorted by who begins soonest, because the only genuinely urgent question this
 * page answers is whether anybody is about to start work without having done
 * what they were supposed to. People with no start date sort last: they are not
 * joiners, they are everybody else who already has an account.
 */
export async function onboardingRoster(): Promise<RosterEntry[]> {
  const db = createServiceClient();
  const { data: profiles } = await db
    .from('profiles')
    .select('id, display_name, email, starts_on, country')
    .order('starts_on', { nullsFirst: false });

  const people = profiles ?? [];

  const entries = await Promise.all(
    people.map(async (p) => {
      const userId = p.id as string;
      const country = (p.country as Country) ?? 'AU';
      const state = await beforeYouBegin(userId, country);
      const required = state.steps.filter((s) => s.required);

      return {
        userId,
        displayName: (p.display_name as string | null) ?? null,
        email: (p.email as string | null) ?? null,
        startsOn: (p.starts_on as string | null) ?? null,
        requiredCount: required.length,
        doneCount: required.filter((s) => s.done).length,
        outstandingCount: state.outstanding.length,
        awaitingFirmCount: state.steps.filter((s) => s.awaitingFirm).length,
        cleared: state.cleared,
        decision: state.decision,
      };
    }),
  );

  // Anybody with a start date first, soonest first, then everybody else.
  return entries.sort((a, b) => {
    if (a.startsOn && b.startsOn) return a.startsOn.localeCompare(b.startsOn);
    if (a.startsOn) return -1;
    if (b.startsOn) return 1;
    return (a.displayName ?? a.email ?? '').localeCompare(b.displayName ?? b.email ?? '');
  });
}

/** One person's checklist, read as the supervisor rather than as them. */
export async function onboardingForPerson(userId: string): Promise<{
  displayName: string | null;
  email: string | null;
  country: Country;
  state: BeforeYouBegin;
} | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('profiles')
    .select('id, display_name, email, country')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;

  const country = (data.country as Country) ?? 'AU';
  return {
    displayName: (data.display_name as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    country,
    state: await beforeYouBegin(userId, country),
  };
}

/**
 * The firm confirming an item, in the name of the administrator doing it.
 *
 * `confirmedBy` is the signed-in administrator's id taken from their session by
 * the caller, never from the request. This runs through the service role, which
 * bypasses Row Level Security, so the policy that pins confirmed_by to auth.uid()
 * cannot help here; the caller checking admin rights and passing its own id is
 * what stands in its place.
 */
export async function confirmStep(
  confirmedBy: string,
  userId: string,
  stepId: string,
): Promise<{ error: string | null }> {
  const db = createServiceClient();

  const { data: step } = await db
    .from('firm_steps')
    .select('id, kind, needs_firm_check')
    .eq('id', stepId)
    .maybeSingle();

  if (!step) return { error: 'That item could not be found.' };
  if (step.kind === 'read') {
    return { error: 'Reading is recorded by the person who read it, not confirmed.' };
  }
  if (!step.needs_firm_check) {
    return { error: 'That item does not need the firm to confirm it.' };
  }

  const { error } = await db
    .from('firm_step_confirmations')
    .insert({ user_id: userId, firm_step_id: stepId, confirmed_by: confirmedBy });

  if (error && error.code !== '23505') {
    return { error: 'That could not be recorded. Please try again.' };
  }
  return { error: null };
}

/**
 * A supervisor clearing somebody to begin, or withdrawing that.
 *
 * The outstanding count is recounted here rather than taken from the page the
 * decision was made on. A stale browser tab must not be able to record that
 * nothing was outstanding at a moment when something was.
 */
export async function recordDecision(
  decidedBy: string,
  userId: string,
  decision: DecisionKind,
  note: string,
): Promise<{ error: string | null }> {
  const person = await onboardingForPerson(userId);
  if (!person) return { error: 'That person could not be found.' };

  const db = createServiceClient();
  const { error } = await db.from('onboarding_decisions').insert({
    user_id: userId,
    decision,
    decided_by: decidedBy,
    outstanding_count: person.state.outstanding.length,
    note: note.slice(0, 500),
  });

  if (error) return { error: 'That could not be recorded. Please try again.' };
  return { error: null };
}

/** The full history for one person. Append-only, so this is the whole story. */
export async function decisionHistory(userId: string): Promise<OnboardingDecision[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('onboarding_decisions')
    .select('decision, decided_at, decided_by, outstanding_count, note')
    .eq('user_id', userId)
    .order('decided_at', { ascending: false });

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: names } = await db
    .from('profiles')
    .select('id, display_name')
    .in('id', [...new Set(rows.map((r) => r.decided_by as string))]);

  const nameById = new Map((names ?? []).map((n) => [n.id as string, n.display_name as string | null]));

  return rows.map((r) => ({
    decision: r.decision as DecisionKind,
    decidedAt: r.decided_at as string,
    decidedBy: r.decided_by as string,
    decidedByName: nameById.get(r.decided_by as string) ?? null,
    outstandingCount: r.outstanding_count as number,
    note: (r.note as string) ?? '',
  }));
}

// -----------------------------------------------------------------------------
// Writing the checklist
// -----------------------------------------------------------------------------

export async function listStepsForAdmin(): Promise<FirmStep[]> {
  const db = createServiceClient();
  const { data } = await db.from('firm_steps').select(STEP_COLUMNS).order('position');
  return (data ?? []).map((r) => shape(r as StepRow));
}

export async function getStepForAdmin(id: string): Promise<FirmStep | null> {
  const db = createServiceClient();
  const { data } = await db.from('firm_steps').select(STEP_COLUMNS).eq('id', id).maybeSingle();
  return data ? shape(data as StepRow) : null;
}
