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
  let body: { prompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const userPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!userPrompt || userPrompt.length > 600) {
    return NextResponse.json({ error: "Describe the photo in a sentence or two." }, { status: 400 });
  }
  const prompt = buildImagePrompt(userPrompt);

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
