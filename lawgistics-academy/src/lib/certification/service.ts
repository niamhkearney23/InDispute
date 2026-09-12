import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { CERTIFICATION_BOXES, SPINE_BOX_NUMBERS } from '@/content/seed/certification-boxes';
import { asCountry } from '@/lib/types';
import type { Country } from '@/lib/types';
import type { CertificationGrade } from './grades';

export type { CertificationGrade } from './grades';
export { GRADE_LABELS } from './grades';

/**
 * The certification register.
 *
 * Reads and writes go through the service role, gated by requireCoach() or
 * checkCoach() at the caller, the same way coach_sessions is: RLS on these
 * tables is real (see 0015_certification.sql) but is not what this app relies
 * on to keep a learner out, in the same way it is not for any other admin
 * page here.
 */

export interface Trainee {
  id: string;
  fullName: string;
  firmName: string;
  country: Country;
  notes: string;
  createdAt: string;
}

export interface CertificationEntry {
  id: string;
  traineeId: string;
  boxNumber: number;
  caseNo: string;
  courtFileRef: string;
  caseTypeStage: string;
  dateIn: string;
  draftBack: string | null;
  grade: CertificationGrade | null;
  screeningConfirmed: boolean;
  note: string;
  createdAt: string;
}

export interface CertificationStatus {
  /** Every box number (1-15) that has at least one entry graded L3. */
  boxesAtL3: number[];
  missingSpineBoxes: number[];
  hasAdvocacyBox: boolean;
  certified: boolean;
}

/**
 * Whether a trainee is certified, from their entries alone.
 *
 * Pure, tested directly the same way isFromToday and resumeIndexFor are: the
 * interesting cases (missing one spine box, ten boxes but no advocacy box) are
 * awkward to set up through the database and trivial to hand a list of
 * entries.
 *
 * A box counts once any entry against it has ever been graded L3, not only
 * the most recent one: a later, unrelated case graded lower does not erase
 * competency already demonstrated.
 */
export function computeCertificationStatus(
  entries: Pick<CertificationEntry, 'boxNumber' | 'grade'>[],
): CertificationStatus {
  const boxesAtL3 = [
    ...new Set(
      entries.filter((e) => e.grade === 'l3_independent').map((e) => e.boxNumber),
    ),
  ].sort((a, b) => a - b);

  const boxesAtL3Set = new Set(boxesAtL3);
  const missingSpineBoxes = SPINE_BOX_NUMBERS.filter((n) => !boxesAtL3Set.has(n));
  const hasAdvocacyBox = CERTIFICATION_BOXES.some(
    (b) => b.isAdvocacy && boxesAtL3Set.has(b.number),
  );

  const certified = missingSpineBoxes.length === 0 && hasAdvocacyBox && boxesAtL3.length >= 10;

  return { boxesAtL3, missingSpineBoxes, hasAdvocacyBox, certified };
}

const GRADE_RANK: Record<CertificationGrade, number> = {
  l1_observed: 1,
  l2_assisted: 2,
  l3_independent: 3,
};

/** The best grade recorded for each box, for the grid rather than the pass/fail check. */
export function bestGradePerBox(
  entries: Pick<CertificationEntry, 'boxNumber' | 'grade'>[],
): Map<number, CertificationGrade> {
  const best = new Map<number, CertificationGrade>();
  for (const entry of entries) {
    if (!entry.grade) continue;
    const current = best.get(entry.boxNumber);
    if (!current || GRADE_RANK[entry.grade] > GRADE_RANK[current]) {
      best.set(entry.boxNumber, entry.grade);
    }
  }
  return best;
}

function toTrainee(row: Record<string, unknown>): Trainee {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    firmName: row.firm_name as string,
    country: asCountry(row.country as string | null),
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
  };
}

function toEntry(row: Record<string, unknown>): CertificationEntry {
  return {
    id: row.id as string,
    traineeId: row.trainee_id as string,
    boxNumber: row.box_number as number,
    caseNo: row.case_no as string,
    courtFileRef: (row.court_file_ref as string) ?? '',
    caseTypeStage: (row.case_type_stage as string) ?? '',
    dateIn: row.date_in as string,
    draftBack: (row.draft_back as string | null) ?? null,
    grade: (row.grade as CertificationGrade | null) ?? null,
    screeningConfirmed: Boolean(row.screening_confirmed),
    note: (row.note as string) ?? '',
    createdAt: row.created_at as string,
  };
}

export async function listTrainees(): Promise<Trainee[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('certification_trainees')
    .select('*')
    .order('full_name', { ascending: true });
  return (data ?? []).map(toTrainee);
}

export async function getTrainee(id: string): Promise<Trainee | null> {
  const db = createServiceClient();
  const { data } = await db.from('certification_trainees').select('*').eq('id', id).maybeSingle();
  return data ? toTrainee(data) : null;
}

export async function entriesForTrainee(traineeId: string): Promise<CertificationEntry[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('certification_entries')
    .select('*')
    .eq('trainee_id', traineeId)
    .order('box_number', { ascending: true })
    .order('date_in', { ascending: false });
  return (data ?? []).map(toEntry);
}

/** Every trainee, with their certification status already computed. */
export async function rosterWithStatus(): Promise<
  Array<{ trainee: Trainee; status: CertificationStatus }>
> {
  const db = createServiceClient();
  const [{ data: trainees }, { data: entries }] = await Promise.all([
    db.from('certification_trainees').select('*').order('full_name', { ascending: true }),
    db.from('certification_entries').select('trainee_id, box_number, grade'),
  ]);

  const entriesByTrainee = new Map<string, { boxNumber: number; grade: CertificationGrade | null }[]>();
  for (const row of entries ?? []) {
    const list = entriesByTrainee.get(row.trainee_id as string) ?? [];
    list.push({
      boxNumber: row.box_number as number,
      grade: (row.grade as CertificationGrade | null) ?? null,
    });
    entriesByTrainee.set(row.trainee_id as string, list);
  }

  return (trainees ?? []).map((row) => {
    const trainee = toTrainee(row);
    return {
      trainee,
      status: computeCertificationStatus(entriesByTrainee.get(trainee.id) ?? []),
    };
  });
}
