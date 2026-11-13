import { q } from "@/lib/firm/db";
import { foreignOrigin, isUuid, json, needMember, readJson } from "@/lib/firm/auth";
import { cleanSlides } from "@/lib/firm/validate";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const MAX_POST_BYTES = 3_500_000;

// One post, in full. A lawyer sees only their own. An admin sees any post in
// their own firm. Everyone else gets "not found", which is also what a valid id
// from another firm gets, so ids cannot be probed.
export async function GET(req: Request, { params }: Ctx) {
  const r = await needMember(req);
  if ("res" in r) return r.res;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Not found." }, 404);
  const rows = await q(
    `select p.id, p.status, p.topic, p.slides, p.caption, p.rev, p.reviewer_note, p.created_at, p.updated_at,
            p.submitted_at, p.reviewed_at, m.id as member_id, m.name as member_name, m.profile as member_profile
       from posts p join members m on m.id = p.member_id
      where p.id = $1 and p.firm_id = $2 and ($3 or p.member_id = $4)`,
    [id, r.ctx.firm.id, r.ctx.member.role === "admin", r.ctx.member.id],
  );
  if (!rows[0]) return json({ error: "Not found." }, 404);
  return json({ post: rows[0] });
}

// Only the author edits, and any edit sends the post back to draft. That is the
// rule that makes an approval mean something: it applies to the words that were
// reviewed, and the moment those change, it no longer does.
export async function PUT(req: Request, { params }: Ctx) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needMember(req);
  if ("res" in r) return r.res;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Not found." }, 404);
  const body = await readJson<{ topic?: unknown; slides?: unknown; caption?: unknown }>(req, MAX_POST_BYTES);
  if (body instanceof Response) return body;
  const slides = cleanSlides(body.slides);
  if (!slides) return json({ error: "That post could not be saved. Remove very large photos and try again." }, 400);
  const topic = typeof body.topic === "string" ? body.topic.slice(0, 1000) : "";
  const caption = typeof body.caption === "string" ? body.caption.slice(0, 8000) : "";

  const rows = await q<{ id: string; rev: number; status: string }>(
    `update posts
        set topic = $1, slides = $2::jsonb, caption = $3, rev = rev + 1, status = 'draft',
            reviewer_note = '', reviewed_by = null, reviewed_at = null, submitted_at = null, updated_at = now()
      where id = $4 and firm_id = $5 and member_id = $6
      returning id, rev, status`,
    [topic, JSON.stringify(slides), caption, id, r.ctx.firm.id, r.ctx.member.id],
  );
  if (!rows[0]) return json({ error: "Not found." }, 404);
  return json({ post: rows[0] });
}
