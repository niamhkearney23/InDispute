import { firmStatus, q, MONTH_START_SQL } from "@/lib/firm/db";
import { getContext, json } from "@/lib/firm/auth";

export const runtime = "nodejs";

// The studio asks this on every load to learn whether it is a solo studio or a
// firm workspace. It answers in three ways: the layer is off, nobody is signed
// in, or here is the member, their firm's locked brand and their allowance.
export async function GET(req: Request) {
  const s = firmStatus();
  if (!s.ok) return json({ configured: false, reason: s.reason });
  const ctx = await getContext(req);
  if (!ctx) return json({ configured: true, member: null });

  const used = await q<{ n: number }>(
    `select count(*)::int as n from usage where member_id = $1 and kind = 'draft' and created_at >= ${MONTH_START_SQL}`,
    [ctx.member.id],
  );
  return json({
    configured: true,
    member: { id: ctx.member.id, name: ctx.member.name, role: ctx.member.role, profile: ctx.member.profile },
    firm: {
      id: ctx.firm.id,
      name: ctx.firm.name,
      brand: ctx.firm.brand,
      requireApproval: ctx.firm.requireApproval,
      monthlyQuota: ctx.firm.monthlyQuota,
    },
    usage: { used: used[0]?.n ?? 0, quota: ctx.firm.monthlyQuota },
  });
}
