import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Access codes are how the studio is opened to people without opening it to
// everyone. Every route that spends money on a model calls guard() first.
//
// ACCESS_CODES is a comma separated list set in the hosting dashboard, one code
// per firm or per person, so one can be revoked without disturbing the rest.
// When it is unset the gate is OFF and nothing changes, so deploying this can
// never lock the owner out of her own app. /api/setup reports which state the
// server is in, so it is never a guess.

function configured(): string[] {
  return (process.env.ACCESS_CODES || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function accessRequired(): boolean {
  return configured().length > 0;
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  // timingSafeEqual throws on unequal lengths, and returning early on length
  // alone would leak it, so compare against a padded copy instead
  const len = Math.max(x.length, y.length);
  const px = Buffer.alloc(len);
  const py = Buffer.alloc(len);
  x.copy(px);
  y.copy(py);
  return timingSafeEqual(px, py) && x.length === y.length;
}

export function codeIsValid(code: string | null | undefined): boolean {
  const codes = configured();
  if (!codes.length) return true;
  const given = (code || "").trim();
  if (!given) return false;
  // check every code rather than stopping at the first match
  let ok = false;
  for (const c of codes) if (same(given, c)) ok = true;
  return ok;
}

/** Returns a 401 response to send back, or null when the request may proceed. */
export function guard(req: Request): NextResponse | null {
  if (codeIsValid(req.headers.get("x-access-code"))) return null;
  return NextResponse.json(
    { error: "This studio is invite only. Enter your access code to continue.", needsCode: true },
    { status: 401 },
  );
}
