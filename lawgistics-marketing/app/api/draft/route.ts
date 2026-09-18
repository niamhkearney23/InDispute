import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// One request per topic, server-side, so the API key never reaches the
// browser. Same drafting brief as the Claude-artifact prototype this app
// grew out of, including the "don't sound like a language model" rules.
type Brand = { kind: "firm" | "business" | "person"; name: string; field: string };

function buildPrompt(topic: string, voiceSample: string | undefined, current: unknown, brand: Brand, format: "carousel" | "poster"): string {
  const shape =
    format === "poster"
      ? 'This is a SINGLE POSTER, not a carousel: return exactly ONE slide, with "layout" set to "title" or "impact" ' +
        'and "ground" set to "light", "dark" or "accent". Put the headline in "statement" (size \'lg\'), ' +
        "the one detail people need (date, time, place, price, or the single takeaway) in \"sub\", and any remaining details " +
        "in \"body\", kept short. \"swipe\" is false. Use the details the author gave exactly as given and do not invent any " +
        "date, time, place or price they did not give. The caption is the post text that goes with the poster."
      : "The carousel reads as hook / context / the issue / the key point or development / a striking line / " +
        "why it matters, across 5 or 6 slides.\n\n" +
        "IMPORTANT, this is what separates a good carousel from a boring one: give each slide a different " +
        '"layout" and vary the "ground" it sits on. Do not send six slides of the same shape. Pick per slide from:\n' +
        '- "title": a big centred line and nothing else. Best for slide 1.\n' +
        '- "bigtype": the words fill the entire frame, edge to edge, with no label or citation showing. Ten words at the very most, and it must be a sentence worth shouting. One per carousel at the most.\n' +
        '- "statement": a line that lands, with a short sub or a paragraph or two under it. The workhorse.\n' +
        '- "essay": a headline over a genuinely dense block of writing, three or four sentences of real argument in "body". Use this once.\n' +
        '- "impact": very large uppercase. Short. Five words at the very most. Use it for the single loudest idea.\n' +
        '- "stat": one figure or short phrase in "statement" (e.g. "166" or "3 years"), and what it means in "sub". Only if there is a real number.\n' +
        '- "list": "statement" is the heading, and "body" is one item per line. Write each line as "Short heading: the sentence that explains it" so every row has a title and a line under it. Three to five rows.\n' +
        '- "checklist": the same shape as "list", but rendered with tick boxes. Use it when the content is genuinely things to do or check. These are the slides people save.\n' +
        '- "quote": "statement" is the quoted line, "sub" is who said it. Only for a genuine quotation.\n\n' +
        '"ground" is "light", "dark" or "accent" (the brand colour as the background). Most slides are light. ' +
        "Put one or two on dark or accent for rhythm, usually the loudest slide and the last one. Never three in a row the same.\n\n" +
        "A good six-slide set might run title / essay / stat / checklist / bigtype / statement, with one or two of " +
        "them on dark or accent. Choose what the content actually calls for, but make the shapes differ.";
  const isLawgistics = !brand.name || brand.name.toUpperCase() === "LAWGISTICS";
  const who =
    brand.kind === "person"
      ? `an individual posting under their own name${brand.name ? ` (${brand.name})` : ""} on their personal LinkedIn and Instagram, building their own profile. Write in the first person singular, as that person, never as a firm or "we". If the topic is legal, general information only, no advice to any individual`
      : brand.kind === "business"
        ? `a business${brand.name ? ` called ${brand.name}` : ""}, posting on its own page. Work out what kind of business it is from the name and the topic and write for its customers, as the business ("we")`
        : isLawgistics
          ? "Lawgistics, a law-careers account for Australian law students and early-career lawyers, posting on its own page"
          : `an Australian law firm called ${brand.name}, posting on its own page for clients, prospective clients and referrers. Write as the firm ("we"), plain English, no legal advice to any individual, general information only`;
  const speciality = brand.field
    ? `\n\nTheir field is: ${brand.field}. Write for the people who would hire them for that, in the language those people actually use, and make the post useful to that audience specifically rather than to lawyers in general.`
    : "";
  const voice = voiceSample && voiceSample.trim()
    ? `\n\nHere is a sample of how this person actually writes. Match its rhythm, vocabulary and level of formality, not its topic:\n"""\n${voiceSample.trim().slice(0, 4000)}\n"""\n`
    : "";
  const revision = current
    ? "\n\nThe author already has a draft and is asking for a change. Here is the current draft as JSON:\n" +
      JSON.stringify(current).slice(0, 20000) +
      "\n\nApply exactly this request from the author, and leave everything the request does not touch as it is " +
      "(same slide count, same wording elsewhere, same caption lines that were not mentioned):\n\"" +
      topic +
      "\"\n\nReturn the complete updated draft in the same JSON shape described below.\n\n"
    : "";
  return (
    "You are drafting a LinkedIn post and matching carousel slides for " + who + ". " +
    "House style: Playfair-serif statements with exactly one italicised phrase each, " +
    "short declarative sentences, one idea per slide. " + shape + "\n\n" +
    "Writing voice: never use an em dash, anywhere, use a comma, colon or full stop instead. Avoid every " +
    "telltale AI-written pattern: no 'it's not just X, it's Y', no 'in a world where', no rhetorical " +
    "questions as filler, no hedge-then-reveal structure, no tricolons for their own sake. Write plain, " +
    "specific, declarative sentences the way a sharp, opinionated person would actually talk, not the way " +
    "a language model default-writes." + speciality + voice + revision +
    (current ? "" : "\n\nTopic: " + topic + "\n\n") +
    "If this is a real case, event or statistic you are not fully certain of the exact citation, date or " +
    "figures for, keep the copy general and do NOT invent a specific citation, party name, date or number. " +
    "Write the substantive point clearly instead of guessing at specifics.\n\n" +
    "Respond with ONLY JSON (no prose, no code fence) matching exactly this shape:\n" +
    '{"kicker":"a short label for every slide, e.g. a series name or date",' +
    '"cite":"footer text for every slide, a real citation if you have one, otherwise a short honest note ' +
    "like 'General information, not legal advice.', use \\\\n for a second line\"," +
    '"caption":"the post caption, written and spaced the way a strong LinkedIn post is: ' +
    "line 1 is a hook that stands on its own and earns the click on 'see more', then one idea per line, " +
    "a blank line between every line (use \\\\n\\\\n), most lines under 12 words, no line longer than two " +
    "sentences, a plain-spoken point of view in the middle, the takeaway near the end as its own line, " +
    'then a one-line general-information disclaimer, no hashtags, no emoji, no em dashes, 120 to 220 words",' +
    '"slides":[{"layout":"title","ground":"light","size":"lg","swipe":true,"statement":"...","sub":"..."},' +
    '{"layout":"essay","ground":"light","size":"md","statement":"...","body":"..."},' +
    '{"layout":"impact","ground":"accent","size":"lg","statement":"..."}]}\n' +
    "Use **text** for bold and *text* for italics inside statement/sub/body/learn. Each slide object needs " +
    '"layout", "ground" and "statement", and may include "sub", "body", "learn" (the exam-usable principle, ' +
    'one sentence, at most one slide in the set), "size" ("lg" or "md"), and "swipe" (true only on slide 1).'
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

  let body: { topic?: unknown; voiceSample?: unknown; current?: unknown; brand?: unknown; format?: unknown };
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
  const current =
    body.current && typeof body.current === "object" && Array.isArray((body.current as { slides?: unknown }).slides)
      ? body.current
      : undefined;

  const rawBrand = (body.brand && typeof body.brand === "object" ? body.brand : {}) as {
    kind?: unknown;
    name?: unknown;
    field?: unknown;
  };
  const brand: Brand = {
    kind: rawBrand.kind === "firm" ? "firm" : rawBrand.kind === "business" ? "business" : "person",
    name: typeof rawBrand.name === "string" ? rawBrand.name.trim().slice(0, 60) : "",
    field: typeof rawBrand.field === "string" ? rawBrand.field.trim().slice(0, 120) : "",
  };

  const format = body.format === "poster" ? "poster" : "carousel";

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: buildPrompt(topic, voiceSample, current, brand, format) }],
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
