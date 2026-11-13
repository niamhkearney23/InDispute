import { q, tx } from "@/lib/firm/db";
import { INVITE_DAYS, foreignOrigin, json, newInvite, notConfigured, readJson, sameSecret } from "@/lib/firm/auth";
import { cleanName } from "@/lib/firm/validate";

export const runtime = "nodejs";

// The platform owner's door: this is how a firm comes to exist. It is guarded by
// OWNER_KEY, a long random secret only the owner holds. It is refused outright
// unless that key is long enough to be worth having, and wrong guesses are
// slowed so it cannot be ground down.

const fails = new Map<string, { n: number; until: number }>();

function ownerOnly(req: Request): Response | null {
  const key = process.env.OWNER_KEY || "";
  if (key.length < 24) {
    return json({ error: "Owner access is not set up. Set OWNER_KEY to a random value of 24 or more characters." }, 503);
  }
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const hit = fails.get(ip);
  if (hit && hit.n >= 8 && hit.until > Date.now()) return json({ error: "Too many attempts. Try again later." }, 429);
  if (!sameSecret(req.headers.get("x-owner-key") || "", key)) {
    const n = (hit && hit.until > Date.now() ? hit.n : 0) + 1;
    fails.set(ip, { n, until: Date.now() + 15 * 60_000 });
    return json({ error: "Not authorised." }, 401);
  }
  fails.delete(ip);
  return null;
}

export async function GET(req: Request) {
  const nc = notConfigured();
  if (nc) return nc;
  const denied = ownerOnly(req);
  if (denied) return denied;
  const rows = await q(
    `select f.id, f.name, f.require_approval, f.monthly_quota, f.created_at,
            (select count(*)::int from members m where m.firm_id = f.id and m.active) as people,
            (select count(*)::int from posts p where p.firm_id = f.id) as posts
       from firms f order by f.created_at desc limit 200`,
  );
  return json({ firms: rows });
}

export async function POST(req: Request) {
  const nc = notConfigured();
  if (nc) return nc;
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const denied = ownerOnly(req);
  if (denied) return denied;

  const body = await readJson<{ firmName?: unknown; adminName?: unknown; monthlyQuota?: unknown; requireApproval?: unknown }>(req);
  if (body instanceof Response) return body;
  const firmName = cleanName(body.firmName);
  const adminName = cleanName(body.adminName);
  if (!firmName || !adminName) return json({ error: "A firm name and the first admin's name are both needed." }, 400);
  const quota = Number.isInteger(body.monthlyQuota) ? Math.min(Math.max(body.monthlyQuota as number, 0), 500) : 4;
  const requireApproval = body.requireApproval === false ? false : true;

  const invite = newInvite();
  const out = await tx(async (c) => {
    const f = await c.query(
      `insert into firms (name, require_approval, monthly_quota) values ($1,$2,$3) returning id, name`,
      [firmName, requireApproval, quota],
    );
    const m = await c.query(
      `insert into members (firm_id, name, role, invite_hash, invite_expires)
       values ($1,$2,'admin',$3, now() + ($4 || ' days')::interval) returning id, name`,
      [f.rows[0].id, adminName, invite.hash, String(INVITE_DAYS)],
    );
    return { firm: f.rows[0], admin: m.rows[0] };
  });

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  return json({
    ...out,
    inviteCode: invite.code,
    // the code rides in the fragment so it is never sent to a server or written to a log
    joinUrl: `${proto}://${host}/join#${invite.code}`,
    inviteValidDays: INVITE_DAYS,
    note: "This code is shown once. It works one time.",
  }, 201);
}

