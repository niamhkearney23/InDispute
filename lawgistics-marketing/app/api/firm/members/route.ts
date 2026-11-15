import { q, MONTH_START_SQL } from "@/lib/firm/db";
import { INVITE_DAYS, foreignOrigin, joinUrlFor, json, needAdmin, newInvite, readJson } from "@/lib/firm/auth";
import { emailNote, emailStatus, sendInviteEmail, validEmail } from "@/lib/firm/email";
import { cleanName } from "@/lib/firm/validate";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const rows = await q(
    `select m.id, m.name, m.role, m.active, m.profile, m.email, m.created_at,
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
  const body = await readJson<{ name?: unknown; role?: unknown; email?: unknown }>(req, 2_000);
  if (body instanceof Response) return body;
  const name = cleanName(body.name);
  if (!name) return json({ error: "A name is needed." }, 400);
  const role = body.role === "admin" ? "admin" : "lawyer";
  const given = typeof body.email === "string" ? body.email.trim() : "";
  const email = given ? validEmail(given) : null;
  if (given && !email) return json({ error: "That email address does not look right." }, 400);

  const invite = newInvite();
  const rows = await q<{ id: string }>(
    `insert into members (firm_id, name, role, email, invite_hash, invite_expires)
     values ($1,$2,$3,$4,$5, now() + ($6 || ' days')::interval) returning id`,
    [r.ctx.firm.id, name, role, email, invite.hash, String(INVITE_DAYS)],
  );
  const joinUrl = joinUrlFor(req, invite.code);

  // The invite exists and is on its way back to the screen whatever happens next, so a
  // failed email can never lose one. Emailing is a convenience on top.
  let emailed: boolean | null = null;
  let note: string | null = null;
  if (email && emailStatus().ok) {
    const res = await sendInviteEmail({
      firmId: r.ctx.firm.id, firmName: r.ctx.firm.name, to: email, name, code: invite.code, joinUrl, days: INVITE_DAYS,
    }).catch(() => ({ sent: false as const, why: "unreachable" as const }));
    emailed = res.sent;
    note = emailNote(res);
  }
  return json(
    {
      member: { id: rows[0].id, name, role },
      inviteCode: invite.code,
      joinUrl,
      inviteValidDays: INVITE_DAYS,
      emailed,
      emailedTo: emailed ? email : null,
      emailNote: note,
    },
    201,
  );
}
