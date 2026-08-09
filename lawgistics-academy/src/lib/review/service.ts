import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { reviewRisk, type ReviewRisk } from './triage';
import { isDueSoon, isLapsed } from './expiry';
import type { Jurisdiction, QuestionOption } from '@/lib/types';

/**
 * The review queue.
 *
 * Questions and facts are different shapes but the same job to review, so they
 * are flattened into one list here. The reviewer should be working through a
 * single pile ordered by risk, not switching between two screens.
 */

/** How the queue is ordered. The URL may only ask for one of these two. */
export type ReviewOrder = 'riskiest' | 'simplest';

export const REVIEW_ORDERS: ReviewOrder[] = ['riskiest', 'simplest'];

export function asReviewOrder(value: string | undefined): ReviewOrder {
  return value === 'simplest' ? 'simplest' : 'riskiest';
}

export interface ReviewItem {
  kind: 'question' | 'fact';
  /** Question id, or fact id. What the actions take. */
  id: string;
  /** Present for questions: verification attaches to the version. */
  versionId: string | null;
  slug: string;
  domainName: string | null;

  /** Fact title, or question stem. */
  heading: string;
  scenario: string | null;
  /** Fact body. Null for questions. */
  body: string | null;
  options: QuestionOption[];
  correctOptionIds: string[];
  explanation: string | null;
  whyItMatters: string | null;
  commonMisconception: string | null;
  memoryTrick: string | null;

  jurisdiction: Jurisdiction;
  court: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  sourceCheckedOn: string | null;

  status: string;
  verificationStatus: string;
  reviewFlagged: boolean;
  reviewNote: string | null;
  /** When this sign-off runs out. Null when it is not signed off. */
  reviewDueOn: string | null;
  /** Signed off once, and now due to be looked at again. */
  lapsed: boolean;
  /** Signed off and running out inside the next couple of months. */
  dueSoon: boolean;
  /** Published while still unverified, the case that matters most. */
  liveToLearners: boolean;

  risk: ReviewRisk;
}

export interface ReviewStats {
  total: number;
  /** Never signed off, plus everything whose sign-off has run out. */
  outstanding: number;
  /** Signed off and still in date. The only number that means anything. */
  verified: number;
  flagged: number;
  liveUnverified: number;
  /** Signed off once, now due again. */
  lapsed: number;
  dueSoon: number;
  /**
   * Withdrawn and not flagged: taken off learners in bulk rather than because
   * somebody said it was wrong. These are the ones that can be put back.
   */
  withdrawn: number;
}

/**
 * Today, as YYYY-MM-DD, for comparing against a date column.
 *
 * UTC, deliberately, unlike the joiner countdown which uses each person's own
 * timezone. The difference is what turns on it: telling somebody they begin
 * tomorrow when they begin today is wrong in a way they will notice on their
 * first morning, whereas an item appearing in the re-check queue a few hours
 * either side of midnight is not wrong in any way that matters. Paying for a
 * profile lookup on every queue load to move it would be precision nobody
 * benefits from.
 */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function first<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null;
}

export async function getReviewItems(order: ReviewOrder = 'riskiest'): Promise<ReviewItem[]> {
  const db = createServiceClient();
  // Read once, so every item in a single queue is judged against the same day.
  const today = todayIso();

  const [{ data: questionRows }, { data: factRows }] = await Promise.all([
    db
      .from('question_versions')
      // `*` rather than an explicit column list: the review card shows the whole
      // item, and a list this long defeats supabase-js's select-string types.
      .select('*, questions(slug, status, domains(name))')
      .eq('is_current', true),
    db.from('daily_facts').select('*, domains(name)'),
  ]);

  const questions: ReviewItem[] = (questionRows ?? []).flatMap((row) => {
    const question = first<{ slug: string; status: string; domains: unknown }>(row.questions);
    if (!question) return [];

    const explanation = row.explanation as string;
    const text = [row.stem, row.scenario, explanation, row.why_it_matters]
      .filter(Boolean)
      .join(' ');

    return [
      {
        kind: 'question' as const,
        id: row.question_id as string,
        versionId: row.id as string,
        slug: question.slug,
        domainName: first<{ name: string }>(question.domains)?.name ?? null,
        heading: row.stem as string,
        scenario: row.scenario,
        body: null,
        options: (row.options ?? []) as QuestionOption[],
        correctOptionIds: (row.correct_option_ids ?? []) as string[],
        explanation,
        whyItMatters: row.why_it_matters,
        commonMisconception: row.common_misconception,
        memoryTrick: row.memory_trick,
        jurisdiction: row.jurisdiction as Jurisdiction,
        court: row.court,
        sourceReference: row.source_reference,
        sourceUrl: row.source_url,
        sourceCheckedOn: row.source_checked_on,
        status: question.status,
        verificationStatus: row.verification_status as string,
        reviewFlagged: row.review_flagged as boolean,
        reviewNote: row.review_note,
        reviewDueOn: (row.review_due_on as string | null) ?? null,
        lapsed: isLapsed(row.verification_status as string, row.review_due_on as string | null, today),
        dueSoon: isDueSoon(row.verification_status as string, row.review_due_on as string | null, today),
        liveToLearners:
          question.status === 'published' && row.verification_status !== 'human_verified',
        risk: reviewRisk({
          text,
          jurisdiction: row.jurisdiction as Jurisdiction,
          sourceReference: row.source_reference,
          sourceUrl: row.source_url,
        }),
      },
    ];
  });

  const facts: ReviewItem[] = (factRows ?? []).map((row) => ({
    kind: 'fact' as const,
    id: row.id as string,
    versionId: null,
    slug: row.slug as string,
    domainName: first<{ name: string }>(row.domains)?.name ?? null,
    heading: row.title as string,
    scenario: null,
    body: row.body as string,
    options: [],
    correctOptionIds: [],
    explanation: null,
    whyItMatters: row.why_it_matters,
    commonMisconception: null,
    memoryTrick: null,
    jurisdiction: row.jurisdiction as Jurisdiction,
    court: row.court,
    sourceReference: row.source_reference,
    sourceUrl: row.source_url,
    sourceCheckedOn: row.source_checked_on,
    status: row.status as string,
    verificationStatus: row.verification_status as string,
    reviewFlagged: row.review_flagged as boolean,
    reviewNote: row.review_note,
    reviewDueOn: (row.review_due_on as string | null) ?? null,
    lapsed: isLapsed(row.verification_status as string, row.review_due_on as string | null, today),
    dueSoon: isDueSoon(row.verification_status as string, row.review_due_on as string | null, today),
    liveToLearners:
      row.status === 'published' && row.verification_status !== 'human_verified',
    risk: reviewRisk({
      text: `${row.title} ${row.body} ${row.why_it_matters ?? ''}`,
      jurisdiction: row.jurisdiction as Jurisdiction,
      sourceReference: row.source_reference,
      sourceUrl: row.source_url,
    }),
  }));

  return sortReviewItems([...questions, ...facts], order);
}

/**
 * Riskiest first is the right default: it puts the items most likely to be
 * wrong in front of the person checking them. It is also, for the same reason,
 * a demoralising place to start, because the first twenty are the most
 * technical things in the bank. Simplest first clears the plain-principle items
 * quickly, which is real progress and a much better first hour.
 */
export function sortReviewItems(items: ReviewItem[], order: ReviewOrder): ReviewItem[] {
  const sorted = [...items];

  if (order === 'simplest') {
    return sorted.sort((a, b) => {
      // Signed-off items sink either way; there is nothing left to do with them.
      // A lapsed sign-off is not done. Sinking it with the verified items is
      // exactly how content ages into being confidently wrong.
      const done = (i: ReviewItem) =>
        i.verificationStatus === 'human_verified' && !i.lapsed ? 1 : 0;
      if (done(a) !== done(b)) return done(a) - done(b);
      if (a.risk.score !== b.risk.score) return a.risk.score - b.risk.score;
      return a.slug.localeCompare(b.slug);
    });
  }

  // Anything already live but unverified first; those are in front of learners
  // right now. Then by risk, then by how much is at stake in getting it wrong.
  return sorted.sort((a, b) => {
    if (a.liveToLearners !== b.liveToLearners) return a.liveToLearners ? -1 : 1;
    // Then anything whose sign-off has run out: it is in front of learners
    // carrying a verified badge that has stopped being true.
    if (a.lapsed !== b.lapsed) return a.lapsed ? -1 : 1;
    if (a.risk.score !== b.risk.score) return b.risk.score - a.risk.score;
    return a.slug.localeCompare(b.slug);
  });
}

export function summarise(items: ReviewItem[]): ReviewStats {
  const verified = (i: ReviewItem) => i.verificationStatus === 'human_verified';
  return {
    total: items.length,
    // A lapsed item counts as outstanding, which is the point of the whole
    // mechanism: the number of things needing attention has to go back up on
    // its own, or nobody ever looks again.
    outstanding: items.filter((i) => !verified(i) || i.lapsed).length,
    verified: items.filter((i) => verified(i) && !i.lapsed).length,
    flagged: items.filter((i) => i.reviewFlagged).length,
    liveUnverified: items.filter((i) => i.liveToLearners).length,
    lapsed: items.filter((i) => i.lapsed).length,
    dueSoon: items.filter((i) => i.dueSoon).length,
    withdrawn: items.filter((i) => i.status === 'requires_review' && !i.reviewFlagged).length,
  };
}
