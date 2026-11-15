import { tx } from "@/lib/firm/db";
import { INVITE_DAYS, foreignOrigin, isUuid, joinUrlFor, json, needAdmin, newInvite, readJson } from "@/lib/firm/auth";
import { emailNote, emailStatus, sendInviteEmail, validEmail } from "@/lib/firm/email";
import { cleanName } from "@/lib/firm/validate";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Rename, change role, switch someone off or on, or issue a fresh invite (for a
// lost phone). Every query is scoped to the admin's own firm, so a valid id from
// another firm simply is not found.
export async function PATCH(req: Request, { params }: Ctx) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needAdmin(req);
  if ("res" in r) return r.res;
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Not found." }, 404);

  const body = await readJson<{ name?: unknown; role?: unknown; active?: unknown; reissueInvite?: unknown; email?: unknown }>(req, 2_000);
  if (body instanceof Response) return body;

  const result = await tx(async (c) => {
    // lock the firm's admin rows so two admins cannot each remove the other at once
    const all = await c.query(
      `select id, role, active, (invite_hash is null) as joined from members where firm_id = $1 for update`,
      [r.ctx.firm.id],
    );
    const target = all.rows.find((m: { id: string }) => m.id === id);
    if (!target) return { status: 404, body: { error: "Not found." } };

    // only an admin who has actually signed in counts as someone who can run the firm.
    // One who still holds an unused invite could never be reached if the invite expired.
    const activeAdmins = all.rows.filter(
      (m: { role: string; active: boolean; id: string; joined: boolean }) =>
        m.role === "admin" && m.active && m.joined && m.id !== id,
    );
    const losingAdmin =
      target.role === "admin" && target.active && (body.active === false || (body.role && body.role !== "admin"));
    if (losingAdmin && activeAdmins.length === 0) {
      return { status: 409, body: { error: "A firm needs at least one admin who has signed in. Add another admin, and have them accept their invite first." } };
    }
    if (body.active === false && id === r.ctx.member.id) {
      return { status: 409, body: { error: "You cannot switch yourself off. Ask another admin to." } };
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    const add = (sql: string, v?: unknown) => {
      if (v !== undefined) vals.push(v);
      sets.push(sql.replace("?", `$${vals.length}`));
    };
    if (body.name !== undefined) {
      const n = cleanName(body.name);
      if (!n) return { status: 400, body: { error: "A name is needed." } };
      add("name = ?", n);
    }
    if (body.role === "admin" || body.role === "lawyer") add("role = ?", body.role);
    if (body.email !== undefined) {
      const given = typeof body.email === "string" ? body.email.trim() : "";
      const e = given ? validEmail(given) : null;
      if (given && !e) return { status: 400, body: { error: "That email address does not look right." } };
      add("email = ?", e); // an empty value clears it
    }
    if (body.active === false) {
      // switching someone off also bumps their session generation, so a cookie
      // they already hold stops working on its next use, and clears any invite
      add("active = false");
      add("session_gen = session_gen + 1");
      add("invite_hash = null");
      add("invite_expires = null");
    } else if (body.active === true) {
      add("active = true");
    }

    let inviteCode: string | undefined;
    // an invite for someone who is switched off could never be redeemed, so refuse it
    const willBeActive = body.active === true || (target.active && body.active !== false);
    if (body.reissueInvite === true && !willBeActive) {
      return { status: 409, body: { error: "Switch this person back on before issuing them an invite." } };
    }
    if (body.reissueInvite === true && willBeActive) {
      const inv = newInvite();
      inviteCode = inv.code;
      add("invite_hash = ?", inv.hash);
      add(`invite_expires = now() + interval '${INVITE_DAYS} days'`);
    }
    if (!sets.length) return { status: 400, body: { error: "Nothing to change." } };

    vals.push(id, r.ctx.firm.id);
    const upd = await c.query(
      `update members set ${sets.join(", ")} where id = $${vals.length - 1} and firm_id = $${vals.length}
         returning id, name, role, active, email`,
      vals,
    );
    const m = upd.rows[0];
    return {
      status: 200,
      body: { member: { id: m.id, name: m.name, role: m.role, active: m.active, email: m.email }, inviteCode, inviteValidDays: inviteCode ? INVITE_DAYS : undefined } as Record<string, unknown>,
      mail: inviteCode && m.email ? { to: m.email as string, name: m.name as string, code: inviteCode } : null,
    };
  });

  // email a re-issued invite after the change is saved, never inside it
  if (result.status === 200 && "mail" in result && result.mail && emailStatus().ok) {
    const joinUrl = joinUrlFor(req, result.mail.code);
    const res = await sendInviteEmail({
      firmId: r.ctx.firm.id, firmName: r.ctx.firm.name, to: result.mail.to, name: result.mail.name,
      code: result.mail.code, joinUrl, days: INVITE_DAYS,
    }).catch(() => ({ sent: false as const, why: "unreachable" as const }));
    (result.body as Record<string, unknown>).emailed = res.sent;
    (result.body as Record<string, unknown>).emailedTo = res.sent ? result.mail.to : null;
    (result.body as Record<string, unknown>).emailNote = emailNote(res);
    (result.body as Record<string, unknown>).joinUrl = joinUrl;
  } else if (result.status === 200 && "mail" in result && result.mail) {
    (result.body as Record<string, unknown>).joinUrl = joinUrlFor(req, result.mail.code);
  }

  return json(result.body, result.status);
}

