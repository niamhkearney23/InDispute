import { q } from "@/lib/firm/db";
import { foreignOrigin, isUuid, json, needMember } from "@/lib/firm/auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Sends a post for review. If the firm has switched approval off there is
// nothing to wait for, so the post is simply marked approved at once.
export async function POST(req: Request, { params }: Ctx) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needMember(req);
  if ("res" in r) return r.res;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Not found." }, 404);

  const next = r.ctx.firm.requireApproval ? "submitted" : "approved";
  const rows = await q<{ id: string; status: string; rev: number }>(
    `update posts
        set status = $1, submitted_at = now(), updated_at = now(),
            reviewed_at = case when $1 = 'approved' then now() else null end,
            reviewer_note = case when $1 = 'approved' then 'Approval is not required by this firm.' else '' end
      where id = $2 and firm_id = $3 and member_id = $4 and status in ('draft','changes_requested')
      returning id, status, rev`,
    [next, id, r.ctx.firm.id, r.ctx.member.id],
  );
  if (!rows[0]) {
    return json({ error: "That post cannot be submitted. It may already be with a reviewer." }, 409);
  }
  return json({ post: rows[0] });
}
