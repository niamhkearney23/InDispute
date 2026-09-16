import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// One request per topic, server-side, so the API key never reaches the
// browser. Same drafting brief as the Claude-artifact prototype this app
// grew out of, including the "don't sound like a language model" rules.
function buildPrompt(topic: string, voiceSample: string | undefined): string {
  const voice = voiceSample && voiceSample.trim()
    ? `\n\nHere is a sample of how this person actually writes. Match its rhythm, vocabulary and level of formality, not its topic:\n"""\n${voiceSample.trim().slice(0, 4000)}\n"""\n`
    : "";
  return (
    "You are drafting an Instagram carousel for a law-student-focused legal marketing account, " +
    "in a consistent house style: Playfair-serif statements with exactly one italicised phrase each, " +
    "short declarative sentences, one idea per slide. The carousel reads as hook / facts / " +
    "issue / ruling or key development / a striking quote or key line / why it matters, across 5 or 6 slides.\n\n" +
    "Writing voice: never use an em dash, anywhere, use a comma, colon or full stop instead. Avoid every " +
    "telltale AI-written pattern: no 'it's not just X, it's Y', no 'in a world where', no rhetorical " +
    "questions as filler, no hedge-then-reveal structure, no tricolons for their own sake. Write plain, " +
    "specific, declarative sentences the way a sharp, opinionated person would actually talk, not the way " +
    "a language model default-writes." + voice + "\n\n" +
    "Topic: " + topic + "\n\n" +
    "If this is a real case, event or statistic you are not fully certain of the exact citation, date or " +
    "figures for, keep the copy general and do NOT invent a specific citation, party name, date or number. " +
    "Write the substantive point clearly instead of guessing at specifics.\n\n" +
    "Respond with ONLY JSON (no prose, no code fence) matching exactly this shape:\n" +
    '{"kicker":"a short label for every slide, e.g. a series name or date",' +
    '"cite":"footer text for every slide, a real citation if you have one, otherwise a short honest note ' +
    "like 'General information, not legal advice.', use \\\\n for a second line\"," +
    '"caption":"an Instagram caption in the same voice, 3-6 short paragraphs, ending with a one-line general-information disclaimer, no hashtags",' +
    '"slides":[{"dark":false,"size":"lg","swipe":true,"statement":"...","sub":"..."},' +
    '{"dark":false,"size":"md","statement":"...","body":"..."}]}\n' +
    "Use **text** for bold and *text* for italics inside statement/sub/body/learn. Each slide object needs " +
    '"statement" and may include "sub", "body", "learn" (the exam-usable principle, one sentence), ' +
    '"dark" (boolean, alternate some slides to navy for variety), "size" (\'lg\' for the cover/quote slides, ' +
    "'md' for the rest), and \"swipe\" (true only on slide 1)."
  );
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  return JSON.parse(raw.trim());
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  let body: { topic?: unknown; voiceSample?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic || topic.length > 1000) {
    return NextResponse.json({ error: "Tell us what to post about (up to 1000 characters)." }, { status: 400 });
  }
  const voiceSample = typeof body.voiceSample === "string" ? body.voiceSample : undefined;

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: buildPrompt(topic, voiceSample) }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  try {
    const draft = extractJson(text);
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json(
      { error: "The draft came back in an unexpected shape. Try again or rephrase the topic." },
      { status: 502 },
    );
  }
}
