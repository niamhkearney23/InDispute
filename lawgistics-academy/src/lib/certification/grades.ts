/**
 * The three grade levels, kept separate from service.ts.
 *
 * service.ts is server-only (it touches the service-role client), but the
 * entry form is a client component that needs these labels to render the
 * grade picker. Splitting this out is what lets it do that without pulling
 * the service-role client into a browser bundle.
 */

export type CertificationGrade = 'l1_observed' | 'l2_assisted' | 'l3_independent';

export const GRADE_LABELS: Record<CertificationGrade, string> = {
  l1_observed: 'L1 · Observed',
  l2_assisted: 'L2 · Assisted',
  l3_independent: 'L3 · Independent',
};
