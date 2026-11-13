import { q } from "@/lib/firm/db";
import { foreignOrigin, json, needMember, readJson } from "@/lib/firm/auth";
import { cleanProfile } from "@/lib/firm/validate";

export const runtime = "nodejs";

// A lawyer edits their own profile and nobody else's. The id comes from the
// signed session, never from the request, so there is nothing to tamper with.
export async function PUT(req: Request) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const r = await needMember(req);
  if ("res" in r) return r.res;
  const body = await readJson(req, 20_000);
  if (body instanceof Response) return body;
  const profile = cleanProfile(body);
  await q(`update members set profile = $1 where id = $2`, [JSON.stringify(profile), r.ctx.member.id]);
  return json({ ok: true, profile });
}
