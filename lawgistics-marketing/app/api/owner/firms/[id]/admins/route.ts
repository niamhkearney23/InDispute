import { tx } from "@/lib/firm/db";
import { INVITE_DAYS, foreignOrigin, isUuid, json, newInvite, notConfigured, readJson, sameSecret } from "@/lib/firm/auth";
import { cleanName } from "@/lib/firm/validate";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// The safety net. If a firm loses its only admin (a lost phone, a person who left)
// nobody inside it can fix that, so the platform owner can add a fresh admin with
// a new invite. Same OWNER_KEY door as creating a firm.
export async function POST(req: Request, { params }: Ctx) {
  const nc = notConfigured();
  if (nc) return nc;
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const key = process.env.OWNER_KEY || "";
  if (key.length < 24) return json({ error: "Owner access is not set up." }, 503);
  if (!sameSecret(req.headers.get("x-owner-key") || "", key)) return json({ error: "Not authorised." }, 401);

  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Not found." }, 404);
  const body = await readJson<{ adminName?: unknown }>(req, 2_000);
  if (body instanceof Response) return body;
  const name = cleanName(body.adminName);
  if (!name) return json({ error: "A name is needed." }, 400);

  const invite = newInvite();
  const out = await tx(async (c) => {
    const f = await c.query(`select id, name from firms where id = $1`, [id]);
    if (!f.rows[0]) return null;
    const m = await c.query(
      `insert into members (firm_id, name, role, invite_hash, invite_expires)
       values ($1,$2,'admin',$3, now() + ($4 || ' days')::interval) returning id, name`,
      [id, name, invite.hash, String(INVITE_DAYS)],
    );
    return { firm: f.rows[0], admin: m.rows[0] };
  });
  if (!out) return json({ error: "Not found." }, 404);

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  return json({ ...out, inviteCode: invite.code, joinUrl: `${proto}://${host}/join#${invite.code}`, inviteValidDays: INVITE_DAYS }, 201);
}
