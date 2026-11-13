import { clearSessionCookie, foreignOrigin, json } from "@/lib/firm/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const origin = foreignOrigin(req);
  if (origin) return origin;
  const res = json({ ok: true });
  clearSessionCookie(res, req);
  return res;
}
