import { NextResponse } from "next/server";
import { draftText, pickProvider } from "@/lib/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const FIELD_RULES: Record<string, string> = {
  statement:
    "This is the headline of a slide. Keep it to one sentence. It must still carry the point on its own. " +
    "Mark exactly one short phrase for emphasis with *asterisks*, no more.",
  sub: "This is the supporting line under a headline. One sentence, plain, no emphasis marks.",
  body:
    "This is the body copy of a slide. Keep the existing paragraph structure: a blank line between paragraphs, " +
    "and if it is a list keep one item per line in the form \"Heading: the line under it\".",
  caption:
    "This is the LinkedIn post itself. Keep the spacing: a hook line that stands alone, then one idea per line, " +
    "a blank line between every line. Keep any disclaimer line at the end.",
  learn: "This is a single pull-out principle. One sentence, no hedging, no sub-clauses.",
};

export async function POST(req: Request) {
  const provider = pickProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "No drafting key is set on the server. Add ANTHROPIC_API_KEY or OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  let body: { field?: unknown; text?: unknown; instruction?: unknown; voiceSample?: unknown; audience?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const field = typeof body.field === "string" ? body.field : "";
  const text = typeof body.text === "string" ? body.text : "";
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  if (!text.trim()) return NextResponse.json({ error: "There is nothing to rewrite yet." }, { status: 400 });
  if (!instruction || instruction.length > 300) {
    return NextResponse.json({ error: "Say what to change, in a few words." }, { status: 400 });
  }

  const voice =
    typeof body.voiceSample === "string" && body.voiceSample.trim()
      ? `\n\nMatch how this person writes:\n"""\n${body.voiceSample.trim().slice(0, 3000)}\n"""`
      : "";
  const audience =
    typeof body.audience === "string" && body.audience.trim()
      ? `\n\nIt is being read by: ${body.audience.trim().slice(0, 120)}.`
      : "";

  const prompt =
    "Rewrite one piece of text from a social post. Return ONLY the rewritten text, with no preamble, " +
    "no quotation marks around it and no explanation.\n\n" +
    (FIELD_RULES[field] || "Keep it the same kind of text and roughly the same length.") +
    "\n\nNever use an em dash. Avoid every telltale AI-written pattern: no 'it's not just X, it's Y', " +
    "no 'in a world where', no rhetorical questions as filler. Plain, specific, declarative sentences. " +
    "Do not introduce any new fact, name, date, number or citation that is not already in the text." +
    audience +
    voice +
    "\n\nThe change asked for: " +
    instruction +
    "\n\nThe text:\n" +
    text;

  try {
    const out = await draftText(provider, prompt, 1500);
    const cleaned = out.trim().replace(/^["“”']+|["“”']+$/g, "");
    if (!cleaned) throw new Error("nothing came back");
    return NextResponse.json({ text: cleaned });
  } catch (err) {
    const message = err instanceof Error ? err.message : "the rewrite failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
