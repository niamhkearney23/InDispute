import { q } from "@/lib/firm/db";
import { foreignOrigin, json, needAdmin, readJson } from "@/lib/firm/auth";
import { cleanBrand } from "@/lib/firm/validate";

export const runtime = "nodejs";

// The firm brand is one record, set by an admin, applied to every lawyer.
// Lawyers cannot change it: that is what makes it a firm brand.
export async function PUT(req: Request) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const body = await readJson<{ brand?: unknown; requireApproval?: unknown; monthlyQuota?: unknown }>(req, 20_000);
  if (body instanceof Response) return body;

  const brand = cleanBrand(body.brand);
  const requireApproval = typeof body.requireApproval === "boolean" ? body.requireApproval : r.ctx.firm.requireApproval;
  const quota = Number.isInteger(body.monthlyQuota)
    ? Math.min(Math.max(body.monthlyQuota as number, 0), 500)
    : r.ctx.firm.monthlyQuota;

  await q(`update firms set brand = $1, require_approval = $2, monthly_quota = $3 where id = $4`, [
    JSON.stringify(brand),
    requireApproval,
    quota,
    r.ctx.firm.id,
  ]);
  return json({ ok: true, brand, requireApproval, monthlyQuota: quota });
}
