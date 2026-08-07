import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import type { TaxonomyOption } from '@/app/admin/question-form';

export async function loadTaxonomy(): Promise<{
  domains: TaxonomyOption[];
  concepts: TaxonomyOption[];
  skills: TaxonomyOption[];
}> {
  const db = createServiceClient();

  const [domains, concepts, skills] = await Promise.all([
    db.from('domains').select('id, name, sort_order').order('sort_order'),
    db.from('concepts').select('id, name, sort_order, domains(name)').order('sort_order'),
    db.from('skills').select('id, name, sort_order').order('sort_order'),
  ]);

  return {
    domains: (domains.data ?? []).map((d) => ({ id: d.id as string, name: d.name as string })),
    concepts: (concepts.data ?? []).map((c) => {
      const domain = Array.isArray(c.domains) ? c.domains[0] : c.domains;
      return {
        id: c.id as string,
        name: c.name as string,
        group: (domain as { name: string } | null)?.name ?? 'Other',
      };
    }),
    skills: (skills.data ?? []).map((s) => ({ id: s.id as string, name: s.name as string })),
  };
}
