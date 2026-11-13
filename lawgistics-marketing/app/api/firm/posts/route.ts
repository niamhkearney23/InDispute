import { q } from "@/lib/firm/db";
import { foreignOrigin, json, needMember, readJson } from "@/lib/firm/auth";
import { cleanSlides } from "@/lib/firm/validate";

export const runtime = "nodejs";

const STATUSES = ["draft", "submitted", "approved", "changes_requested"];
const MAX_POST_BYTES = 3_500_000; // Vercel refuses request bodies over 4.5MB

// A list, not the posts themselves: the slides stay out of it so the page stays
// light, and a reviewer opens one post to see it.
export async function GET(req: Request) {
  const r = await needMember(req);
  if ("res" in r) return r.res;
  const url = new URL(req.url);
  const wantFirm = url.searchParams.get("scope") === "firm";
  if (wantFirm && r.ctx.member.role !== "admin") return json({ error: "Only a firm admin can do that." }, 403);
  const status = url.searchParams.get("status") || "";

  const where = ["p.firm_id = $1"];
  const vals: unknown[] = [r.ctx.firm.id];
  if (!wantFirm) {
    vals.push(r.ctx.member.id);
    where.push(`p.member_id = $${vals.length}`);
  }
  if (STATUSES.includes(status)) {
    vals.push(status);
    where.push(`p.status = $${vals.length}`);
  }
  const rows = await q(
    `select p.id, p.status, p.topic, p.rev, p.reviewer_note, p.created_at, p.updated_at, p.submitted_at, p.reviewed_at,
            p.slides->0->>'statement' as title, jsonb_array_length(p.slides) as slide_count,
            m.id as member_id, m.name as member_name
       from posts p join members m on m.id = p.member_id
      where ${where.join(" and ")}
      order by coalesce(p.submitted_at, p.updated_at) desc limit 200`,
    vals,
  );
  return json({ posts: rows });
}

export async function POST(req: Request) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needMember(req);
  if ("res" in r) return r.res;
  const body = await readJson<{ topic?: unknown; slides?: unknown; caption?: unknown }>(req, MAX_POST_BYTES);
  if (body instanceof Response) return body;
  const slides = cleanSlides(body.slides);
  if (!slides) return json({ error: "That post could not be saved. Remove very large photos and try again." }, 400);

  const topic = typeof body.topic === "string" ? body.topic.slice(0, 1000) : "";
  const caption = typeof body.caption === "string" ? body.caption.slice(0, 8000) : "";
  const rows = await q<{ id: string; rev: number; status: string }>(
    `insert into posts (firm_id, member_id, topic, slides, caption)
     values ($1,$2,$3,$4::jsonb,$5) returning id, rev, status`,
    [r.ctx.firm.id, r.ctx.member.id, topic, JSON.stringify(slides), caption],
  );
  return json({ post: rows[0] }, 201);
}
