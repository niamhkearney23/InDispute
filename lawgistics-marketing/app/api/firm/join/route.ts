import { q } from "@/lib/firm/db";
import { foreignOrigin, hashInvite, json, notConfigured, readJson, setSessionCookie, signSession } from "@/lib/firm/auth";

export const runtime = "nodejs";

// Redeems a one time invite. The claim is a single UPDATE that clears the hash
// and returns the row, so two people racing with the same code cannot both win,
// and a wrong, used, expired or revoked code all look identical from outside.
export async function POST(req: Request) {
  const nc = notConfigured();
  if (nc) return nc;
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const body = await readJson<{ code?: unknown }>(req, 2_000);
  if (body instanceof Response) return body;
  const code = typeof body.code === "string" ? body.code.slice(0, 80) : "";
  if (code.replace(/[^A-Za-z0-9]/g, "").length < 16) {
    return json({ error: "That code was not recognised. Check it and try again." }, 401);
  }

  const rows = await q<{ id: string; firm_id: string; role: string; session_gen: number }>(
    `update members
        set invite_hash = null, invite_expires = null
      where invite_hash = $1 and active
        and (invite_expires is null or invite_expires > now())
      returning id, firm_id, role, session_gen`,
    [hashInvite(code)],
  );
  const m = rows[0];
  if (!m) return json({ error: "That code was not recognised. Check it and try again." }, 401);

  const res = json({ ok: true, role: m.role });
  setSessionCookie(res, req, signSession(m.id, m.firm_id, m.session_gen));
  return res;
}
