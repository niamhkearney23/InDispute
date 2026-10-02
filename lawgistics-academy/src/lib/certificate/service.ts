import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getModuleProgress } from '@/lib/modules/service';
import { mattersMarkedGood } from '@/lib/matters/service';
import { MATTERS_FOR_CERTIFICATE, certificateEarned } from '@/lib/matters/rules';
import type { Country } from '@/lib/types';

/**
 * The certificate: every required module finished and five matters marked
 * Good by a lawyer. Worked out from the learner's own records, read through
 * their own client, so nothing here can be satisfied by a request. The first
 * time it is seen to be met, the server issues it once, and the date on it is
 * the database's.
 */
export interface CertificateStatus {
  earned: boolean;
  issuedAt: string | null;
  mattersGood: number;
  mattersNeeded: number;
  requiredModules: Array<{ name: string; complete: boolean; correctOnce: number; total: number }>;
}

export async function certificateStatus(userId: string, country: Country): Promise<CertificateStatus> {
  const db = await createSupabaseServerClient();
  const [progress, good, existing] = await Promise.all([
    getModuleProgress(userId, country),
    mattersMarkedGood(userId),
    db.from('certificates').select('issued_at').eq('user_id', userId).maybeSingle(),
  ]);

  const requiredModules = progress
    .filter((p) => p.module.required && p.total > 0)
    .map((p) => ({ name: p.module.name, complete: p.complete, correctOnce: p.correctOnce, total: p.total }));
  const requiredLeft = requiredModules.filter((m) => !m.complete).length;

  let issuedAt = (existing.data as { issued_at: string } | null)?.issued_at ?? null;
  const earned = issuedAt !== null || certificateEarned({ requiredModulesLeft: requiredLeft, mattersGood: good });

  if (earned && !issuedAt) {
    const service = createServiceClient();
    // Issued once: a second request finds the row already there and the
    // insert is refused by the unique key, which is fine.
    await service.from('certificates').insert({ user_id: userId, country, matters: Math.max(good, 1) });
    const { data } = await service
      .from('certificates')
      .select('issued_at')
      .eq('user_id', userId)
      .maybeSingle();
    issuedAt = (data as { issued_at: string } | null)?.issued_at ?? null;
  }

  return {
    earned,
    issuedAt,
    mattersGood: good,
    mattersNeeded: MATTERS_FOR_CERTIFICATE,
    requiredModules,
  };
}
