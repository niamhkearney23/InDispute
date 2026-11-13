import { q } from "@/lib/firm/db";
import { foreignOrigin, isUuid, json, needAdmin, readJson } from "@/lib/firm/auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// A decision from an admin. It must name the revision they were looking at: if
// the author has edited since, the revision has moved on and the decision is
// refused, so nobody ever approves words they did not read.
export async function POST(req: Request, { params }: Ctx) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Not found." }, 404);

  const body = await readJson<{ decision?: unknown; note?: unknown; rev?: unknown }>(req, 5_000);
  if (body instanceof Response) return body;
  const decision = body.decision === "approve" ? "approved" : body.decision === "changes" ? "changes_requested" : null;
  if (!decision) return json({ error: "Choose approve or request changes." }, 400);
  if (!Number.isInteger(body.rev)) return json({ error: "Reload the post and try again." }, 400);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (decision === "changes_requested" && !note) {
    return json({ error: "Say what needs changing, so the author knows what to do." }, 400);
  }

  const rows = await q<{ id: string; status: string; rev: number }>(
    `update posts
        set status = $1, reviewer_note = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now()
      where id = $4 and firm_id = $5 and status = 'submitted' and rev = $6
      returning id, status, rev`,
    [decision, note, r.ctx.member.id, id, r.ctx.firm.id, body.rev],
  );
  if (!rows[0]) {
    return json({ error: "This post changed, or was already reviewed. Reload it to see the latest.", stale: true }, 409);
  }
  return json({ post: rows[0] });
}
