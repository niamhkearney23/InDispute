import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Contextual photography only: places, objects, light. No text on the image
// (the slide carries the words) and no faces, matching the account's rule
// that no identifiable person appears without consent.
function buildImagePrompt(userPrompt: string): string {
  return (
    userPrompt.trim() +
    ". Editorial photograph, natural light, muted considered tones, shallow depth of field, " +
    "portrait orientation. No text, no words, no letters, no logos, no watermarks, no people's faces."
  );
}

// A designed background rather than a photo: dark-toned in the brand's own
// colours so the slide's white text reads on it, with the middle left open.
function buildDesignPrompt(userPrompt: string, colours: { navy: string; accent: string; cream: string }): string {
  return (
    "Abstract background design for a premium social media graphic, portrait orientation. " +
    `Dark overall, built from the colour ${colours.navy}, with shapes and highlights in ${colours.accent} and small touches of ${colours.cream}. ` +
    "Soft geometric forms, layered depth, subtle grain, restrained and modern, with generous empty space in the middle for text to sit on. " +
    (userPrompt.trim() ? `Direction: ${userPrompt.trim()}. ` : "") +
    "No text, no letters, no words, no numbers, no logos, no people."
  );
}

async function generate(model: string, prompt: string, size: string, extra: Record<string, unknown>) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size, n: 1, ...extra }),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { b64_json?: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || `image request failed (${res.status})`);
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image came back");
  return b64;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set on the server." }, { status: 500 });
  }
  let body: { prompt?: unknown; mode?: unknown; colours?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const userPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const mode = body.mode === "design" ? "design" : "photo";
  if (userPrompt.length > 600 || (mode === "photo" && !userPrompt)) {
    return NextResponse.json({ error: "Describe the photo in a sentence or two." }, { status: 400 });
  }
  const hex = (v: unknown, fallback: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
  const raw = (body.colours && typeof body.colours === "object" ? body.colours : {}) as Record<string, unknown>;
  const colours = { navy: hex(raw.navy, "#171D2B"), accent: hex(raw.accent, "#3A5697"), cream: hex(raw.cream, "#EDE7DC") };
  const prompt = mode === "design" ? buildDesignPrompt(userPrompt, colours) : buildImagePrompt(userPrompt);

  try {
    let b64: string;
    try {
      b64 = await generate("gpt-image-1", prompt, "1024x1536", { quality: "medium" });
    } catch {
      b64 = await generate("dall-e-3", prompt, "1024x1792", { response_format: "b64_json", quality: "standard" });
    }
    return NextResponse.json({ image: "data:image/png;base64," + b64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "image generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
