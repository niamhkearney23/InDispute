import { NextResponse } from "next/server";
import { accessRequired, codeIsValid } from "@/lib/access";

export const runtime = "nodejs";

// Lets the studio check a code before it lets someone through the door, so a
// wrong code is caught at the gate and not three screens later at "Write it".
// It answers yes or no and nothing else: it never echoes, hints at or lists a code.
export async function POST(req: Request) {
  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.slice(0, 200) : "";
  } catch {
    /* an unreadable body is simply a wrong code */
  }
  if (!accessRequired()) return NextResponse.json({ ok: true, required: false });
  if (codeIsValid(code)) return NextResponse.json({ ok: true, required: true });
  return NextResponse.json({ ok: false, required: true }, { status: 401 });
}
