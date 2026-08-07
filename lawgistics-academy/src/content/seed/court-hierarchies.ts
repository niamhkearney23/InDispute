import type { Country } from '@/lib/types';

/**
 * The court hierarchies, as data.
 *
 * Drawn rather than photographed. A picture of a court hierarchy is a file
 * nobody can correct, goes stale the moment a court is renamed, and cannot be
 * checked by anything. This is a list of courts and what sits above each one,
 * so the diagram is generated, the same structure answers questions about
 * appeal routes, and a reviewer can correct a court by editing one line.
 *
 * `tier` is only for drawing: 0 is the apex, and courts on the same tier are
 * drawn side by side. It is not a claim that courts on a tier are equivalent.
 * The two Malaysian High Courts share a tier because they are of co-ordinate
 * jurisdiction; the Australian Federal Court and the State Supreme Courts share
 * one because they are parallel hierarchies that meet only at the High Court.
 *
 * NOT VERIFIED. Same standing as every other piece of content here: drafted
 * without a qualified reader, and to be checked before anyone learns from it.
 */

export interface Court {
  /** Stable id, used as the option id on a diagram question. */
  slug: string;
  name: string;
  /** Shown under the name when the full name is too long for a small screen. */
  short?: string;
  tier: number;
  /** Where an appeal from this court ordinarily goes. Null at the apex. */
  appealsTo: string | null;
  note?: string;
}

export interface CourtHierarchy {
  country: Country;
  name: string;
  courts: Court[];
}

const AUSTRALIA: CourtHierarchy = {
  country: 'AU',
  name: 'Australian courts',
  courts: [
    {
      slug: 'hca',
      name: 'High Court of Australia',
      short: 'High Court',
      tier: 0,
      appealsTo: null,
      note: 'Final court of appeal for every Australian court, federal and State. Special leave is generally required.',
    },
    {
      slug: 'fca',
      name: 'Federal Court of Australia',
      short: 'Federal Court',
      tier: 1,
      appealsTo: 'hca',
      note: 'Federal civil jurisdiction. A parallel hierarchy to the States, not above them.',
    },
    {
      slug: 'supreme-court',
      name: 'Supreme Court of a State or Territory',
      short: 'Supreme Court',
      tier: 1,
      appealsTo: 'hca',
      note: 'Unlimited civil jurisdiction within its State or Territory. Its Court of Appeal hears appeals from the courts below it.',
    },
    {
      slug: 'fcfcoa',
      name: 'Federal Circuit and Family Court of Australia',
      short: 'FCFCOA',
      tier: 2,
      appealsTo: 'fca',
      note: 'Commenced 1 September 2021, in two divisions.',
    },
    {
      slug: 'intermediate',
      name: 'District or County Court',
      short: 'Intermediate court',
      tier: 2,
      appealsTo: 'supreme-court',
      note: 'County Court in Victoria; District Court in New South Wales, Queensland, South Australia and Western Australia. Tasmania, the ACT and the Northern Territory have no intermediate court.',
    },
    {
      slug: 'magistrates',
      name: 'Magistrates or Local Court',
      short: 'Lowest court',
      tier: 3,
      appealsTo: 'intermediate',
      note: 'Local Court in New South Wales; Magistrates Court elsewhere. Subject to a monetary limit.',
    },
  ],
};

const MALAYSIA: CourtHierarchy = {
  country: 'MY',
  name: 'Malaysian courts',
  courts: [
    {
      slug: 'federal-court',
      name: 'Federal Court of Malaysia',
      short: 'Federal Court',
      tier: 0,
      appealsTo: null,
      note: 'The apex court. A civil appeal to it generally requires leave.',
    },
    {
      slug: 'court-of-appeal',
      name: 'Court of Appeal',
      tier: 1,
      appealsTo: 'federal-court',
      note: 'The intermediate appellate court, where most appeals end in practice.',
    },
    {
      slug: 'high-court-malaya',
      name: 'High Court in Malaya',
      tier: 2,
      appealsTo: 'court-of-appeal',
      note: 'One of two High Courts of co-ordinate jurisdiction under article 121 of the Federal Constitution.',
    },
    {
      slug: 'high-court-sabah-sarawak',
      name: 'High Court in Sabah and Sarawak',
      short: 'High Court, Sabah and Sarawak',
      tier: 2,
      appealsTo: 'court-of-appeal',
      note: 'Equal in status to the High Court in Malaya, not subordinate to it.',
    },
    {
      slug: 'sessions-court',
      name: 'Sessions Court',
      tier: 3,
      appealsTo: 'high-court-malaya',
      note: 'The higher of the two subordinate courts, with a monetary limit on its civil jurisdiction.',
    },
    {
      slug: 'magistrates-court',
      name: 'Magistrates Court',
      tier: 4,
      appealsTo: 'sessions-court',
      note: 'The lowest court in the ordinary civil hierarchy.',
    },
  ],
};

/**
 * The Syariah courts are deliberately absent from the Malaysian diagram. They
 * are State courts outside this hierarchy, and drawing them as a rung would
 * teach exactly the error that article 121(1A) of the Federal Constitution
 * exists to prevent. They are covered by their own question instead.
 */
export const COURT_HIERARCHIES: Record<Country, CourtHierarchy> = {
  AU: AUSTRALIA,
  MY: MALAYSIA,
};

/** Courts grouped into the rows they are drawn in, apex first. */
export function tiersOf(hierarchy: CourtHierarchy): Court[][] {
  const byTier = new Map<number, Court[]>();
  for (const court of hierarchy.courts) {
    const row = byTier.get(court.tier) ?? [];
    row.push(court);
    byTier.set(court.tier, row);
  }
  return [...byTier.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}
