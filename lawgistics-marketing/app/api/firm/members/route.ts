import { q, MONTH_START_SQL } from "@/lib/firm/db";
import { INVITE_DAYS, foreignOrigin, json, needAdmin, newInvite, readJson } from "@/lib/firm/auth";
import { cleanName } from "@/lib/firm/validate";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const rows = await q(
    `select m.id, m.name, m.role, m.active, m.profile, m.created_at,
            (m.invite_hash is not null and (m.invite_expires is null or m.invite_expires > now())) as invite_pending,
            (select count(*)::int from usage u
               where u.member_id = m.id and u.kind = 'draft' and u.created_at >= ${MONTH_START_SQL}) as used_this_month,
            (select count(*)::int from posts p where p.member_id = m.id) as posts
       from members m where m.firm_id = $1
      order by m.role, m.created_at`,
    [r.ctx.firm.id],
  );
  return json({ members: rows, monthlyQuota: r.ctx.firm.monthlyQuota });
}

// Adds a person and returns their invite exactly once. The firm id comes from
// the admin's session, so an admin can only ever add people to their own firm.
export async function POST(req: Request) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const body = await readJson<{ name?: unknown; role?: unknown }>(req, 2_000);
  if (body instanceof Response) return body;
  const name = cleanName(body.name);
  if (!name) return json({ error: "A name is needed." }, 400);
  const role = body.role === "admin" ? "admin" : "lawyer";

  const invite = newInvite();
  const rows = await q<{ id: string }>(
    `insert into members (firm_id, name, role, invite_hash, invite_expires)
     values ($1,$2,$3,$4, now() + ($5 || ' days')::interval) returning id`,
    [r.ctx.firm.id, name, role, invite.hash, String(INVITE_DAYS)],
  );
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  return json(
    { member: { id: rows[0].id, name, role }, inviteCode: invite.code, joinUrl: `${proto}://${host}/join#${invite.code}`, inviteValidDays: INVITE_DAYS },
    201,
  );
}
