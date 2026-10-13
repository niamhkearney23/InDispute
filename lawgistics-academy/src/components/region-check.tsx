import 'server-only';

import { Notice } from '@/components/ui';
import { regionProblem } from '@/lib/region';

/** The region warning on the admin pages; see regionProblem. */
export function RegionCheck() {
  const problem = regionProblem();
  if (!problem) return null;
  return (
    <div className="mb-6">
      <Notice tone="warn">
        <strong>Server region.</strong> {problem}
      </Notice>
    </div>
  );
}
