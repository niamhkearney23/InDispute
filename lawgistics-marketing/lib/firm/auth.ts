import { NextResponse } from "next/server";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { firmStatus, q } from "./db";

/* ---------------------------------------------------------------------------
   Invite codes. One time, 100 bits, Crockford base32 so there is no 0/O or 1/I
   to mistype. Only a hash is ever stored, so a database leak does not hand out
   working invites, and the code is shown to the admin exactly once.
--------------------------------------------------------------------------- */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newInvite(): { code: string; hash: string } {
  const bytes = randomBytes(20);
  let raw = "";
  // 256 is divisible by 32, so masking is uniform with no modulo bias
  for (const b of bytes) raw += ALPHABET[b & 31];
  const code = raw.match(/.{4}/g)!.join("-");
  return { code, hash: hashInvite(raw) };
}

export function hashInvite(input: string): string {
  const raw = input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    // forgive the characters the alphabet leaves out
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  return createHash("sha256").update(raw).digest("hex");
}

export const INVITE_DAYS = 14;

/* ---------------------------------------------------------------------------
   Sessions. A signed cookie, no session table. Revocation does not rely on the
   cookie: every request loads the member, so deactivating someone (which also
   bumps session_gen) ends their access on their next click.
--------------------------------------------------------------------------- */

const COOKIE = "lgm_session";
const SESSION_DAYS = 30;

type Payload = { m: string; f: string; g: number; e: number };

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function mac(body: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET || "").update(body).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function signSession(memberId: string, firmId: string, gen: number): string {
  const p: Payload = { m: memberId, f: firmId, g: gen, e: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 };
  const body = b64(JSON.stringify(p));
  return `v1.${body}.${mac(`v1.${body}`)}`;
}

function readSession(token: string): Payload | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  if (!safeEqual(parts[2], mac(`v1.${parts[1]}`))) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as Payload;
    if (!p || typeof p.m !== "string" || typeof p.f !== "string" || typeof p.e !== "number") return null;
    if (p.e < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

function cookieFrom(req: Request): string {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

function isHttps(req: Request): boolean {
  return req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
}

export function setSessionCookie(res: NextResponse, req: Request, token: string) {
  res.cookies.set({
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(req),
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export function clearSessionCookie(res: NextResponse, req: Request) {
  res.cookies.set({ name: COOKIE, value: "", httpOnly: true, sameSite: "lax", secure: isHttps(req), path: "/", maxAge: 0 });
}

/* ---------------------------------------------------------------------------
   Who is asking
--------------------------------------------------------------------------- */

export type Brand = {
  cream?: string;
  navy?: string;
  accent?: string;
  serif?: string;
  sans?: string;
  style?: string;
  disclaimer?: string;
};
export type Profile = { role?: string; field?: string; audience?: string; voice?: string };

export type Ctx = {
  member: { id: string; firmId: string; name: string; role: "admin" | "lawyer"; profile: Profile };
  firm: { id: string; name: string; brand: Brand; requireApproval: boolean; monthlyQuota: number };
};

type Row = {
  mid: string;
  firm_id: string;
  mname: string;
  role: "admin" | "lawyer";
  profile: Profile;
  active: boolean;
  session_gen: number;
  fname: string;
  brand: Brand;
  require_approval: boolean;
  monthly_quota: number;
};

/** The signed in member and their firm, or null for anyone else. Never throws on bad input. */
export async function getContext(req: Request): Promise<Ctx | null> {
  if (!firmStatus().ok) return null;
  const token = cookieFrom(req);
  if (!token) return null;
  const p = readSession(token);
  if (!p) return null;
  const rows = await q<Row>(
    `select m.id as mid, m.firm_id, m.name as mname, m.role, m.profile, m.active, m.session_gen,
            f.name as fname, f.brand, f.require_approval, f.monthly_quota
       from members m join firms f on f.id = m.firm_id
      where m.id = $1 and m.firm_id = $2`,
    [p.m, p.f],
  ).catch(() => []);
  const r = rows[0];
  if (!r || !r.active || r.session_gen !== p.g) return null;
  return {
    member: { id: r.mid, firmId: r.firm_id, name: r.mname, role: r.role, profile: r.profile || {} },
    firm: {
      id: r.firm_id,
      name: r.fname,
      brand: r.brand || {},
      requireApproval: r.require_approval,
      monthlyQuota: r.monthly_quota,
    },
  };
}

/* ---------------------------------------------------------------------------
   Route helpers. Each returns either the thing needed or a response to send.
--------------------------------------------------------------------------- */

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export { json };

export function notConfigured(): NextResponse | null {
  const s = firmStatus();
  return s.ok ? null : json({ error: s.reason, configured: false }, 503);
}

/** A browser form on another site cannot set this, so a foreign Origin means a forged request. */
export function foreignOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null; // not a browser, and a cookie is not what is being relied on
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  try {
    if (new URL(origin).host !== host) return json({ error: "Request refused." }, 403);
  } catch {
    return json({ error: "Request refused." }, 403);
  }
  return null;
}

export async function needMember(req: Request): Promise<{ ctx: Ctx } | { res: NextResponse }> {
  const nc = notConfigured();
  if (nc) return { res: nc };
  const ctx = await getContext(req);
  if (!ctx) return { res: json({ error: "Please sign in.", needsSignIn: true }, 401) };
  return { ctx };
}

export async function needAdmin(req: Request): Promise<{ ctx: Ctx } | { res: NextResponse }> {
  const r = await needMember(req);
  if ("res" in r) return r;
  if (r.ctx.member.role !== "admin") return { res: json({ error: "Only a firm admin can do that." }, 403) };
  return r;
}

/** Reads a JSON body without trusting its size or its shape. */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 64_000): Promise<T | NextResponse> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes) return json({ error: "That is too large to save." }, 413);
  let text = "";
  try {
    text = await req.text();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (Buffer.byteLength(text) > maxBytes) return json({ error: "That is too large to save." }, 413);
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) return json({ error: "Invalid request body." }, 400);
    return v as T;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
}

export function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Constant time string comparison for secrets. */
export function sameSecret(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}
