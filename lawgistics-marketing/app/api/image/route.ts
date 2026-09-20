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

// A designed background rather than a photo. A generic "abstract gradient"
// brief produces forgettable images, so each request picks one committed art
// direction and describes it concretely.
const ART_DIRECTIONS = [
  "Liquid chrome: molten metal caught mid-flow, iridescent reflections, razor-sharp highlights against deep shadow, the surface rippling like mercury.",
  "Brutalist architecture photographed from below: vast concrete planes, a hard diagonal shaft of afternoon light, deep geometric shadow, monumental and still.",
  "Risograph print: two inks overprinted slightly out of register, visible paper tooth, coarse halftone dots, bold simple shapes, the ink sitting heavy and matte.",
  "Long-exposure light trails in darkness: fine luminous lines carving arcs through black space, motion frozen, everything else falling away into shadow.",
  "Extreme macro of a natural surface: cracked mineral, raw silk weave, or oxidised metal, the texture filling the frame, lit raking from one side so every ridge casts a shadow.",
  "Aerial abstraction: a coastline or salt flat seen from very high up, rivers and sediment reading as pure line and field, flattened into graphic shapes.",
  "Glass and caustics: thick prisms refracting a single beam, sharp bands of colour thrown across a dark surface, hard edges and clean optical geometry.",
  "Volumetric fog in a dark room with one distant light source, thick atmosphere, a single soft shaft cutting through, everything dissolving into depth.",
  "Cut paper: layered heavy stock in a few flat tones, each layer casting a real soft shadow on the one beneath, crisp scissored edges, tactile and physical.",
  "Ink in water: a single plume blooming and unfurling in slow motion through dark liquid, delicate tendrils, high contrast, caught at the moment of dispersal.",
];

function buildDesignPrompt(
  userPrompt: string,
  colours: { navy: string; accent: string; cream: string },
): string {
  const direction = ART_DIRECTIONS[Math.floor(Math.random() * ART_DIRECTIONS.length)];
  return (
    "A striking, art-directed background image for a premium social media graphic. Portrait orientation, 4:5. " +
    `Art direction: ${direction} ` +
    `Palette: predominantly deep dark tones built around ${colours.navy}, with the key accents and highlights in ${colours.accent}, ` +
    `and occasional pale ${colours.cream} catching the light. Rich, contrasty, gallery quality, shot or rendered with real craft. ` +
    (userPrompt.trim() ? `The subject should evoke: ${userPrompt.trim()}. ` : "") +
    "Composition: the visual interest sits around the edges and corners, leaving the centre of the frame calmer and darker " +
    "so white text can be laid over it and stay readable. " +
    "Absolutely no text, no letters, no words, no numbers, no logos, no watermarks, no people."
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
