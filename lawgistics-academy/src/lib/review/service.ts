import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { reviewRisk, type ReviewRisk } from './triage';
import type { Jurisdiction, QuestionOption } from '@/lib/types';

/**
 * The review queue.
 *
 * Questions and facts are different shapes but the same job to review, so they
 * are flattened into one list here. The reviewer should be working through a
 * single pile ordered by risk, not switching between two screens.
 */

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
  /** Published while still unverified — the case that matters most. */
  liveToLearners: boolean;

  risk: ReviewRisk;
}

export interface ReviewStats {
  total: number;
  outstanding: number;
  verified: number;
  flagged: number;
  liveUnverified: number;
}

function first<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null;
}

export async function getReviewItems(): Promise<ReviewItem[]> {
  const db = createServiceClient();

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
    liveToLearners:
      row.status === 'published' && row.verification_status !== 'human_verified',
    risk: reviewRisk({
      text: `${row.title} ${row.body} ${row.why_it_matters ?? ''}`,
      jurisdiction: row.jurisdiction as Jurisdiction,
      sourceReference: row.source_reference,
      sourceUrl: row.source_url,
    }),
  }));

  // Anything already live but unverified first — those are in front of learners
  // right now. Then by risk, then by how much is at stake in getting it wrong.
  return [...questions, ...facts].sort((a, b) => {
    if (a.liveToLearners !== b.liveToLearners) return a.liveToLearners ? -1 : 1;
    if (a.risk.score !== b.risk.score) return b.risk.score - a.risk.score;
    return a.slug.localeCompare(b.slug);
  });
}

export function summarise(items: ReviewItem[]): ReviewStats {
  return {
    total: items.length,
    outstanding: items.filter((i) => i.verificationStatus !== 'human_verified').length,
    verified: items.filter((i) => i.verificationStatus === 'human_verified').length,
    flagged: items.filter((i) => i.reviewFlagged).length,
    liveUnverified: items.filter((i) => i.liveToLearners).length,
  };
}
