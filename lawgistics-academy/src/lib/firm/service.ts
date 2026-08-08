import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import type { Country } from '@/lib/types';

/**
 * Firm modules: the firm's own induction.
 *
 * This is a separate service from lib/modules on purpose, and the two never
 * call each other. Training modules are ours, verified by us, and completion is
 * derived from answering questions correctly. A firm module is the firm's, is
 * not verified by us at all, and completion is a person saying they have read
 * something.
 *
 * That second one is a weaker claim and it should be. Nothing here pretends a
 * policy has been understood, only that it was put in front of a named person
 * who said they had read it, on a date the database stamped. That is what a
 * firm can actually show somebody, and dressing it up as anything more would
 * make it worth less rather than more.
 */

export type FirmModuleKind = 'welcome' | 'policy';

export interface FirmModule {
  id: string;
  slug: string;
  name: string;
  summary: string;
  kind: FirmModuleKind;
  /** Null means every learner, whatever country their account says. */
  country: Country | null;
  required: boolean;
  position: number;
  published: boolean;
  /** The current version, absent only if the firm saved a module with no content. */
  versionId: string | null;
  version: number | null;
  body: string;
}

export interface LearnerFirmModule extends FirmModule {
  /** When this learner acknowledged the current version, or null. */
  acknowledgedAt: string | null;
}

interface ModuleRow {
  id: string;
  slug: string;
  name: string;
  summary: string;
  kind: FirmModuleKind;
  country: Country | null;
  required: boolean;
  position: number;
  published: boolean;
}

const MODULE_COLUMNS = 'id, slug, name, summary, kind, country, required, position, published';

function shape(row: ModuleRow, version: { id: string; version: number; body: string } | undefined) {
  return {
    ...row,
    summary: row.summary ?? '',
    versionId: version?.id ?? null,
    version: version?.version ?? null,
    body: version?.body ?? '',
  };
}

async function currentVersions(moduleIds: string[]) {
  if (moduleIds.length === 0) return new Map<string, { id: string; version: number; body: string }>();

  const db = createServiceClient();
  const { data } = await db
    .from('firm_module_versions')
    .select('id, firm_module_id, version, body')
    .in('firm_module_id', moduleIds)
    .eq('is_current', true);

  return new Map(
    (data ?? []).map((v) => [
      v.firm_module_id as string,
      { id: v.id as string, version: v.version as number, body: v.body as string },
    ]),
  );
}

/**
 * What this learner should see.
 *
 * A module with no country set reaches everyone. That is the default and it is
 * the case that matters: this app already expects an Australian-trained intern
 * to be sitting in a Malaysian firm, and the firm's own rules apply to them on
 * the same day they apply to everybody else. Scoping firm content by the
 * country on an account would hide the firm's AI policy from the people least
 * likely to already know it.
 */
export async function listFirmModulesForLearner(
  userId: string,
  country: Country,
): Promise<LearnerFirmModule[]> {
  const db = createServiceClient();

  const { data: rows } = await db
    .from('firm_modules')
    .select(MODULE_COLUMNS)
    .eq('published', true)
    .or(`country.is.null,country.eq.${country}`)
    .order('position');

  const modules = (rows ?? []) as ModuleRow[];
  if (modules.length === 0) return [];

  const versions = await currentVersions(modules.map((m) => m.id));
  const versionIds = [...versions.values()].map((v) => v.id);

  const { data: acks } = versionIds.length
    ? await db
        .from('firm_module_acknowledgements')
        .select('firm_module_version_id, acknowledged_at')
        .eq('user_id', userId)
        .in('firm_module_version_id', versionIds)
    : { data: [] };

  const ackByVersion = new Map(
    (acks ?? []).map((a) => [a.firm_module_version_id as string, a.acknowledged_at as string]),
  );

  return modules
    .map((row) => {
      const version = versions.get(row.id);
      return {
        ...shape(row, version),
        acknowledgedAt: version ? (ackByVersion.get(version.id) ?? null) : null,
      };
    })
    // A module the firm has published but never written content for is not
    // something to put in front of a learner as an empty page.
    .filter((m) => m.body.trim().length > 0);
}

export async function getFirmModuleForLearner(
  userId: string,
  country: Country,
  slug: string,
): Promise<LearnerFirmModule | null> {
  const all = await listFirmModulesForLearner(userId, country);
  return all.find((m) => m.slug === slug) ?? null;
}

/**
 * Required firm modules this learner has not acknowledged.
 *
 * Note what "outstanding" means for a new version: acknowledging version 1 does
 * not acknowledge version 2, so changing the policy puts it back in front of
 * everyone. That is the behaviour a firm needs and the reason the record is
 * pinned to a version rather than to a module.
 */
export async function outstandingFirmModules(
  userId: string,
  country: Country,
): Promise<LearnerFirmModule[]> {
  const all = await listFirmModulesForLearner(userId, country);
  return all.filter((m) => m.required && !m.acknowledgedAt);
}

/**
 * Record that this learner has read the current version.
 *
 * Idempotent, and the version is looked up here rather than accepted from the
 * caller: a request must not be able to name which version it is acknowledging,
 * or the record would say what the sender wanted it to say.
 */
export async function acknowledgeFirmModule(
  userId: string,
  country: Country,
  slug: string,
): Promise<{ error: string | null }> {
  const found = await getFirmModuleForLearner(userId, country, slug);
  if (!found || !found.versionId) return { error: 'That module could not be found.' };
  if (found.acknowledgedAt) return { error: null };

  const db = createServiceClient();
  const { error } = await db
    .from('firm_module_acknowledgements')
    .insert({ user_id: userId, firm_module_version_id: found.versionId });

  // A duplicate means it was already acknowledged, which is the outcome asked
  // for. Anything else is a real failure and must not read as success.
  if (error && error.code !== '23505') {
    return { error: 'That could not be recorded. Please try again.' };
  }
  return { error: null };
}

// -----------------------------------------------------------------------------
// Administration
// -----------------------------------------------------------------------------

export async function listFirmModulesForAdmin(): Promise<FirmModule[]> {
  const db = createServiceClient();
  const { data: rows } = await db.from('firm_modules').select(MODULE_COLUMNS).order('position');

  const modules = (rows ?? []) as ModuleRow[];
  const versions = await currentVersions(modules.map((m) => m.id));
  return modules.map((row) => shape(row, versions.get(row.id)));
}

export async function getFirmModuleForAdmin(id: string): Promise<FirmModule | null> {
  const db = createServiceClient();
  const { data: row } = await db.from('firm_modules').select(MODULE_COLUMNS).eq('id', id).maybeSingle();
  if (!row) return null;

  const versions = await currentVersions([id]);
  return shape(row as ModuleRow, versions.get(id));
}

export interface FirmModuleRecordRow {
  userId: string;
  displayName: string | null;
  email: string | null;
  acknowledgedAt: string | null;
  /** The version they acknowledged, when it is not the current one. */
  staleVersion: number | null;
}

/**
 * Who has read the current version, and who has not.
 *
 * This is the page a firm actually opens, so it lists everybody rather than
 * only the people who have complied. A list of names that have acknowledged
 * something answers the easy question; the one worth paying for is who has not.
 *
 * Somebody who acknowledged an earlier version shows as outstanding with the
 * version they did read, because "they read the old one" is a different fact
 * from "they have not read anything" and a firm needs to be able to tell them
 * apart.
 */
export async function getFirmModuleRecord(id: string): Promise<FirmModuleRecordRow[]> {
  const db = createServiceClient();

  const [{ data: profiles }, { data: versions }] = await Promise.all([
    db.from('profiles').select('id, display_name, email').order('display_name'),
    db.from('firm_module_versions').select('id, version, is_current').eq('firm_module_id', id),
  ]);

  const versionById = new Map(
    (versions ?? []).map((v) => [
      v.id as string,
      { version: v.version as number, isCurrent: v.is_current as boolean },
    ]),
  );
  if (versionById.size === 0) return [];

  const { data: acks } = await db
    .from('firm_module_acknowledgements')
    .select('user_id, firm_module_version_id, acknowledged_at')
    .in('firm_module_version_id', [...versionById.keys()]);

  // Latest acknowledgement per person, current version preferred over an old one.
  const best = new Map<string, { at: string; version: number; isCurrent: boolean }>();
  for (const ack of acks ?? []) {
    const meta = versionById.get(ack.firm_module_version_id as string);
    if (!meta) continue;

    const userId = ack.user_id as string;
    const existing = best.get(userId);
    const candidate = {
      at: ack.acknowledged_at as string,
      version: meta.version,
      isCurrent: meta.isCurrent,
    };
    if (!existing || (candidate.isCurrent && !existing.isCurrent) || candidate.version > existing.version) {
      best.set(userId, candidate);
    }
  }

  return (profiles ?? []).map((p) => {
    const entry = best.get(p.id as string);
    return {
      userId: p.id as string,
      displayName: (p.display_name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
      acknowledgedAt: entry?.isCurrent ? entry.at : null,
      staleVersion: entry && !entry.isCurrent ? entry.version : null,
    };
  });
}
