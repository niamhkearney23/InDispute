#!/usr/bin/env node
// Daily Instagram/LinkedIn carousel generator. Research + copy + render, in
// one script, per CLAUDE.md: one lead judgment per weekday (commercial over
// criminal where there's a choice), Friday = The Big Case File. Confirmed
// only, never fabricate. Delivery stays MANUAL: this commits ready-to-post
// assets and appends to reports/POST-QUEUE.md, it never posts anything.
import { readFile, writeFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { research } from "./lib/research.mjs";
import { renderSlides } from "./lib/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const AU_COURT_SITES = [
  "austlii.edu.au",
  "fedcourt.gov.au",
  "hcourt.gov.au",
  "supremecourt.vic.gov.au",
  "countycourt.vic.gov.au",
];

function todayParts() {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const dow = now.getUTCDay(); // used only for Friday detection below via AEST offset
  return { iso, now };
}

// AEST/AEDT is ahead of UTC; treat the run as "Friday" if it's Friday in
// Sydney at the time this runs. The workflow schedules this for AU morning,
// so a fixed +11h offset (covers both AEST +10 and AEDT +11 safely enough
// for day-of-week purposes) is good enough here.
function isFridayInAU(date) {
  const auTime = new Date(date.getTime() + 11 * 60 * 60 * 1000);
  return auTime.getUTCDay() === 5;
}

const SIGN_OFF = `Want international legal experience? You have come to the right place.
Lawgistics places Australian law students in legal internships in Kuala Lumpur. Courtroom access, practising lawyers, live matters.
Applications via the link in bio.`;

const SCHEMA_NOTE = `Respond with ONLY a single fenced \`\`\`json code block. Escape it as
valid JSON, use HTML entities (&ldquo; &rdquo; &rsquo; &middot; &rarr;) instead of raw
smart quotes/dashes so downstream HTML rendering matches the rest of the account, and
NEVER use an em dash (—) anywhere, use a comma, colon or full stop instead. Shape:
{
  "hasLead": true,
  "reason": "only present if hasLead is false: why nothing qualified today",
  "case": {
    "name": "Party v Party",
    "citation": "[YYYY] COURT NN",
    "court": "full court name and division",
    "date": "YYYY-MM-DD",
    "panel": "judge name(s)",
    "category": "Commercial|Criminal|Employment|IP|Media|Regulatory|...",
    "sourceUrl": "the real URL you verified this against"
  },
  "kicker": "Daily Court Intelligence · DD.MM.YY",
  "citationLine": "<b>Party v Party</b> [YYYY] COURT NN<br>Full court name · DD Month YYYY · judge(s)",
  "slides": [
    {"n":1,"size":"lg","statement":"hook sentence with <em>one emphasised phrase</em>","sub":"optional italic subline","swipe":true},
    {"n":2,"size":"md","statement":"short lead-in","body":"<p>facts, 1-2 short paragraphs</p>"},
    {"n":3,"size":"md","statement":"short lead-in","body":"<p>the legal issue</p>"},
    {"n":4,"size":"md","statement":"short lead-in","body":"<p>the ruling</p>"},
    {"n":5,"size":"lg","statement":"a striking quote or the holding in the court's own words"},
    {"n":6,"size":"md","statement":"why it matters","body":"<p>tie it back to what a law student should take from it</p>","dark":true}
  ],
  "learnThis": "one sentence stating the legal PRINCIPLE (not the outcome), no sub-clauses, exam-usable",
  "learnSlideIndex": 4,
  "captions": {
    "instagram": "full caption, thought-leadership register, ends with the sign-off block then a general-information disclaimer then hashtags",
    "linkedin": "full LinkedIn post, longer form, ends with a question"
  },
  "hashtags": "#auslaw #space-separated #lowercase",
  "altText": "one sentence describing the carousel for accessibility"
}
Every fact must trace to sourceUrl. If nothing in the window is both real and verifiable, set hasLead to false and explain why, do not force a weak or unconfirmed post.`;

function weekdayPrompt() {
  return `Find the most significant Australian court judgment published in
the last 1-3 business days: Federal Court, Full Federal Court, High Court,
Supreme Court of Victoria (including Court of Appeal), or County Court of
Victoria. Where there is a genuine choice, prefer commercial and corporate
law (contract, banking and finance, corporations, competition and
consumer, insolvency, employment, IP, media and defamation, sports and
entertainment contracts, regulatory enforcement) over criminal law, this is
a preference not an absolute rule, run a criminal case if it is genuinely
the best and most useful story available. Verify every fact you use against
the primary judgment or an official court listing before including it.

Then write a 6-slide Instagram carousel in Niamh's established house
style: Playfair Display serif statements with one italicised phrase each,
short sentences, one idea per slide, Morning Brew energy, no jargon. The
carousel reads as hook / facts / issue / ruling / the court's own words /
why it matters. Every claim must be something you can point to sourceUrl
for.

${SCHEMA_NOTE}`;
}

function bigCaseFilePrompt() {
  return `It's Friday: find a current, legally substantive, pop-culture-
adjacent legal story suitable for "The Big Case File", a celebrity trial,
sports star contract dispute, high-profile defamation case, reality-TV
legal drama, band royalties fight, influencer ad-compliance bust, brand
dispute, or a corporate collapse with public interest. Prefer a commercial
angle (contract, IP, defamation, consumer, brand, royalties, collapse) over
a celebrity criminal trial where there's a genuine choice. This MUST be
real and current, verify every fact against a real news source or the
judgment itself, and because this involves named public figures, do not
embellish, speculate, or state anything about a person's conduct or
character beyond what a credible source directly reports, defamation risk
is real here.

Then write the same 6-slide carousel format as any other day (hook / facts
/ issue / ruling or current status / a striking quote / why it matters),
in Niamh's house style described below.

${SCHEMA_NOTE}`;
}

async function main() {
  const { iso, now } = todayParts();
  const friday = isFridayInAU(now);

  const result = await research({
    system: "You are researching and drafting for a real Instagram/LinkedIn account read by law students and early-career lawyers. Confirmed facts only, sourced, never invented.",
    prompt: friday ? bigCaseFilePrompt() : weekdayPrompt(),
    allowedDomains: friday ? undefined : AU_COURT_SITES,
    maxUses: 12,
  });

  if (!result.hasLead) {
    console.log(`No lead today: ${result.reason || "not specified"}`);
    return;
  }

  const { case: c, kicker, citationLine, slides, learnThis, learnSlideIndex, captions, hashtags, altText } = result;

  if (!Array.isArray(slides) || slides.length !== 6) {
    throw new Error("Expected exactly 6 slides, got: " + JSON.stringify(slides).slice(0, 200));
  }

  const learnHtml = `<div class="learn"><b>Learn this:</b> ${learnThis}</div>`;
  const renderSlideDefs = slides.map((s) => {
    let inner = `<div class="statement ${s.size}">${s.statement}</div>`;
    if (s.sub) inner += `<div class="sub">${s.sub}</div>`;
    if (s.body) inner += `<div class="body">${s.body}</div>`;
    if (s.n === learnSlideIndex) inner += learnHtml;
    return {
      slug: `slide${s.n}`,
      kicker,
      inner,
      cite: citationLine,
      dark: !!s.dark,
      swipe: !!s.swipe,
    };
  });

  const outDir = join(ROOT, "reports", "assets", iso);
  await renderSlides(renderSlideDefs, outDir);

  // Drop the intermediate HTML, keep only the PNGs the posting kit references.
  const { readdir, unlink } = await import("fs/promises");
  for (const f of await readdir(outDir)) {
    if (f.endsWith(".html")) await unlink(join(outDir, f));
  }

  const disclaimer = "General information only, not legal advice. Check details against the full judgment before publication.";

  const postingKit = `# Posting Kit, ${iso}${friday ? " (The Big Case File)" : ""}

**Case:** ${c.name}, ${c.citation}, ${c.court}, ${c.date}
**Source used for verification:** ${c.sourceUrl}
**Category:** ${c.category}

Upload the slides in order (slide1.png -> slide6.png).

**Instagram caption (copy-paste):**

${captions.instagram}

${SIGN_OFF}

${disclaimer}

${hashtags}

**Alt text:** ${altText}

---

**LinkedIn post:**

${captions.linkedin}

---

**Verify before posting:** confirm the facts above against the primary judgment or an official court listing before publishing, this kit was compiled from ${c.sourceUrl} by an automated research pass.
`;

  await writeFile(join(outDir, "POSTING-KIT.md"), postingKit);

  const brief = `# Lawgistics Daily Court Intelligence

**Edition:** ${iso}${friday ? " (The Big Case File)" : ""}

## Lead case

**${c.name}**, ${c.citation}
${c.court}, ${c.date}${c.panel ? `, ${c.panel}` : ""}
Category: ${c.category}
Source: ${c.sourceUrl}

## Confirmed facts

${(c.confirmedFacts || []).map((f) => `- ${f}`).join("\n")}

## Learning line

Learn this: ${learnThis}

## Carousel

See \`assets/${iso}/\` for slides and the posting kit. Generated by
\`automation/daily-carousel.mjs\`, an automated research pass, not a lawyer.
Verify against the primary source before publishing.

---
*General information only, not legal advice.*
`;

  await writeFile(join(ROOT, "reports", `${iso}-daily-court-intelligence.md`), brief);

  const queuePath = join(ROOT, "reports", "POST-QUEUE.md");
  const queue = await readFile(queuePath, "utf8");
  const row = `| ${iso} | ${c.name}, ${c.citation}${friday ? " (Big Case File)" : ""} | reports/assets/${iso}/slide*.png | READY, generated by daily automation, verify before posting |\n`;
  await writeFile(queuePath, queue.trimEnd() + "\n" + row);

  console.log(`Generated ${friday ? "Big Case File" : "daily"} post for ${iso}: ${c.name} (${c.citation})`);
}

main().catch((err) => {
  console.error("daily-carousel failed:", err);
  process.exit(1);
});
