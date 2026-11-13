import { q, MONTH_START_SQL } from "@/lib/firm/db";
import { json, needAdmin } from "@/lib/firm/auth";

export const runtime = "nodejs";

// For whoever runs marketing: who is posting, how much of their allowance they
// have used, and what is waiting on a reviewer. Scoped to the admin's firm.
export async function GET(req: Request) {
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const people = await q(
    `select m.id, m.name, m.role, m.active,
            (select count(*)::int from usage u where u.member_id = m.id and u.kind = 'draft'
               and u.created_at >= ${MONTH_START_SQL}) as this_month,
            (select count(*)::int from usage u where u.member_id = m.id and u.kind = 'draft'
               and u.created_at >= ${MONTH_START_SQL} - interval '1 month'
               and u.created_at <  ${MONTH_START_SQL}) as last_month,
            (select count(*)::int from posts p where p.member_id = m.id and p.status = 'approved') as approved,
            (select count(*)::int from posts p where p.member_id = m.id and p.status = 'submitted') as waiting
       from members m where m.firm_id = $1 order by m.active desc, m.name`,
    [r.ctx.firm.id],
  );
  const totals = await q<{ status: string; n: number }>(
    `select status, count(*)::int as n from posts where firm_id = $1 group by status`,
    [r.ctx.firm.id],
  );
  return json({
    monthlyQuota: r.ctx.firm.monthlyQuota,
    people,
    posts: Object.fromEntries(totals.map((t) => [t.status, t.n])),
  });
}
