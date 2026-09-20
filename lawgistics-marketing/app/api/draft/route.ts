import { NextResponse } from "next/server";
import { draftText, pickProvider } from "@/lib/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

// One request per topic, server-side, so the API key never reaches the
// browser. Same drafting brief as the Claude-artifact prototype this app
// grew out of, including the "don't sound like a language model" rules.
type Brand = {
  kind: "firm" | "business" | "person";
  name: string;
  field: string;
  audience: string;
  hasDisclaimer: boolean;
};

type Pattern = { layout: string; ground: string }[];

function buildPrompt(
  topic: string,
  voiceSample: string | undefined,
  current: unknown,
  brand: Brand,
  format: "carousel" | "poster",
  pattern: Pattern | undefined,
): string {
  // Reusing last time's shapes is what keeps a grid looking like one brand.
  const patternBrief =
    pattern && pattern.length
      ? "\n\nThe author wants this post to match the shape of their last one, so their feed stays consistent. " +
        "Use exactly these slides, in this order, with these layouts and grounds, and write the content to fit them:\n" +
        pattern.map((p, i) => `${i + 1}. layout "${p.layout}" on ground "${p.ground}"`).join("\n") +
        "\nDo not add, drop or reorder slides, and do not substitute a different layout.\n"
      : "";
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
        '- "quote": "statement" is the quoted line, "sub" is who said it. Only for a genuine quotation.\n' +
        '- "split": the canvas is divided. A block of colour across the top carries "statement", and "sub" plus "body" sit on the plain half underneath. Strong for a claim and its explanation.\n' +
        '- "twocol": divided down the middle. "statement" runs down a coloured column on the left, "sub" and "body" fill the right. Good when the heading and the detail are equally important.\n' +
        '- "sidebar": a narrow band of colour down the left edge carrying the label, with "statement", "sub" and "body" on the rest. A quieter way to break the rhythm.\n' +
        '- "pyramid": a tiered diagram. "body" is one tier per line, TOP tier first, each as "Label: what it covers", three or four tiers. Use it when things genuinely stack, where the top rests on the bottom (foundations under surface, or a small visible part over a large hidden one). Not for a plain list.\n' +
        '- "steps": a numbered sequence with a thread running down it. "body" is one step per line as "Step name: what happens". Use it for a process in real order, three to five steps.\n' +
        '- "compare": two columns side by side. "body" is exactly TWO blocks separated by a blank line; in each block the first line is the column heading (e.g. "What clients think" / "What actually happens", or "Before" / "After") and the lines under it are its points, two to four each.\n' +
        '- "band": a full-width stripe of the brand colour straight across the middle of the frame carrying "statement" reversed out of it, with "sub" and "body" underneath. Use it when one line is the point of the slide.\n' +
        '- "duo": the frame cut vertically into two colour fields. "statement" sits on the floor of the coloured half, "sub" and "body" fill the plain half.\n' +
        '- "frame": a ruled box inset from the edges with the label sitting on the top rule and everything centred inside it. Formal, like a notice. Good for a closing line or a principle.\n' +
        '- "numeral": a figure the height of the page sitting behind the words. Put the figure itself in "tag" (one or two characters, e.g. "3" or "01"), and the point in "statement". Use it when the slide really is the nth of something.\n' +
        '- "edge": nothing in the top half, then "sub" and a very large "statement" hard down on the floor of the frame above a ruled line. Use it for a line with weight.\n\n' +
        "The three diagrams are worth reaching for when the content really has that structure: they are the slides people save and send on. Do not force one onto content that is just a list.\n\n" +
        '"ground" is "light", "dark" or "accent" (the brand colour as the background). Most slides are light. ' +
        "Put one or two on dark or accent for rhythm, usually the loudest slide and the last one. Never three in a row the same.\n\n" +
        '"anchor" moves the block of words within the frame: "top", "mid" or "bottom". Change it from slide to slide. ' +
        "Two slides that share a layout but sit at different heights still read as two different slides.\n\n" +
        "Build the set so the reader gets a different KIND of slide each time they swipe. Across six slides you " +
        "should hit most of these roles, in an order that suits the argument:\n" +
        "  1. an opening statement or title\n" +
        "  2. a short story or a dense block of real argument (essay)\n" +
        "  3. something enumerated: a numbered list, a checklist or steps\n" +
        "  4. something visual: a figure, a pyramid or a comparison\n" +
        "  5. a pull-out: a quote, an impact line or a wall of type\n" +
        "  6. a closing takeaway\n" +
        "At least TWO slides must use a composition that carves up the canvas rather than stacking words down " +
        "the middle of it: split, twocol, sidebar, band, duo, frame, numeral or edge. Never use the same layout " +
        "twice in a row, and never more than twice in the whole set. A carousel of six stacked statement " +
        "slides is the failure mode: it is what makes a post look generated rather than designed.";
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
    ? `\n\nTheir field is: ${brand.field}.`
    : "";
  // Who they want reading it shapes the writing more than the practice area does.
  const audience = brand.audience
    ? `\n\nThey want this read by: ${brand.audience}. Write it FOR those people. Use the words they use about their own problems, not the words lawyers use about the law. Assume they are intelligent and busy and have no legal training. The test for every line is whether one of those readers would stop scrolling for it.`
    : brand.field
      ? "\n\nWrite for the people who would hire them for that, in the language those people actually use, not for other lawyers."
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
    "short declarative sentences, one idea per slide. " + shape + patternBrief + "\n\n" +
    "Writing voice: never use an em dash, anywhere, use a comma, colon or full stop instead. Avoid every " +
    "telltale AI-written pattern: no 'it's not just X, it's Y', no 'in a world where', no rhetorical " +
    "questions as filler, no hedge-then-reveal structure, no tricolons for their own sake. Write plain, " +
    "specific, declarative sentences the way a sharp, opinionated person would actually talk, not the way " +
    "a language model default-writes." + speciality + audience + voice + revision +
    (current
      ? ""
      : "\n\nWhat to post about. This may be a one-line topic, or it may be source material " +
        "(a case note, an email, a draft, a judgment summary) to build the post from. If it is " +
        "source material, use it as the substance and do not simply summarise it:\n" + topic + "\n\n") +
    "If this is a real case, event or statistic you are not fully certain of the exact citation, date or " +
    "figures for, keep the copy general and do NOT invent a specific citation, party name, date or number. " +
    "Write the substantive point clearly instead of guessing at specifics.\n\n" +
    "Respond with ONLY JSON (no prose, no code fence) matching exactly this shape:\n" +
    '{"kicker":"a short label for every slide, e.g. a series name or date",' +
    '"cite":"' + (brand.hasDisclaimer
      ? "a real case citation if this post is about a specific decision you are certain of, otherwise the EMPTY STRING. " +
        "The author has set their own footer note, which is used whenever this is empty, so do not write a disclaimer here"
      : "a real citation if you have one, otherwise a short honest note like 'General information, not legal advice.', use \\\\n for a second line") +
    '",' +
    '"caption":"the post caption, written and spaced the way a strong LinkedIn post is: ' +
    "line 1 is a hook that stands on its own and earns the click on 'see more', then one idea per line, " +
    "a blank line between every line (use \\\\n\\\\n), most lines under 12 words, no line longer than two " +
    "sentences, a plain-spoken point of view in the middle, the takeaway near the end as its own line, " +
    'then a one-line general-information disclaimer, no hashtags, no emoji, no em dashes, 120 to 220 words",' +
    '"slides":[{"layout":"title","ground":"light","size":"lg","swipe":true,"statement":"...","sub":"..."},' +
    '{"layout":"essay","ground":"light","size":"md","statement":"...","body":"..."},' +
    '{"layout":"impact","ground":"accent","size":"lg","statement":"..."}]}\n' +
    "Use **text** for bold and *text* for italics inside statement/sub/body/learn. Each slide object needs " +
    '"layout", "ground" and "statement", and may include "anchor", "tag", "sub", "body", "learn" (the exam-usable principle, ' +
    'one sentence, at most one slide in the set), "size" ("lg" or "md"), "swipe" (true only on slide 1), and ' +
    '"motif".\n\n' +
    '"motif" draws geometry in the brand colour behind the words: "none", "arc" (rings, lower right), ' +
    '"circle" (upper right), "triangle" (lower left), "rules" (short line stacks in two corners), ' +
    '"grid" (a field of dots, lower right), "corner" (bracket marks), "burst" (radiating lines, lower right). ' +
    "Use one on two or three slides in a set, not on all of them, and leave it \"none\" on any slide whose " +
    "content already fills the frame (bigtype, the diagrams, a long essay or list). It is punctuation, not decoration."
  );
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  return JSON.parse(raw.trim());
}

export async function POST(req: Request) {
  const provider = pickProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "No drafting key is set on the server. Add ANTHROPIC_API_KEY or OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  let body: { topic?: unknown; voiceSample?: unknown; current?: unknown; brand?: unknown; format?: unknown; pattern?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Generous, because people paste in a judgment summary, a client email or a
  // draft article they want turned into a post, not just a one-line topic.
  const TOPIC_MAX = 12000;
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) {
    return NextResponse.json({ error: "Tell us what to post about." }, { status: 400 });
  }
  if (topic.length > TOPIC_MAX) {
    return NextResponse.json(
      {
        error: `That is ${topic.length.toLocaleString()} characters and the limit is ${TOPIC_MAX.toLocaleString()}. Trim it, or paste the part you want the post built from.`,
      },
      { status: 400 },
    );
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
    audience?: unknown;
    hasDisclaimer?: unknown;
  };
  const brand: Brand = {
    kind: rawBrand.kind === "firm" ? "firm" : rawBrand.kind === "business" ? "business" : "person",
    name: typeof rawBrand.name === "string" ? rawBrand.name.trim().slice(0, 60) : "",
    field: typeof rawBrand.field === "string" ? rawBrand.field.trim().slice(0, 120) : "",
    audience: typeof rawBrand.audience === "string" ? rawBrand.audience.trim().slice(0, 120) : "",
    hasDisclaimer: rawBrand.hasDisclaimer === true,
  };

  const format = body.format === "poster" ? "poster" : "carousel";
  const pattern = Array.isArray(body.pattern)
    ? (body.pattern as unknown[])
        .slice(0, 12)
        .filter((p): p is { layout: string; ground: string } =>
          !!p && typeof p === "object" && typeof (p as { layout?: unknown }).layout === "string",
        )
        .map((p) => ({ layout: String(p.layout).slice(0, 20), ground: String(p.ground || "light").slice(0, 10) }))
    : undefined;

  const prompt = buildPrompt(topic, voiceSample, current, brand, format, pattern);

  let text: string;
  try {
    text = await draftText(provider, prompt, 8000, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "the drafting request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

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
