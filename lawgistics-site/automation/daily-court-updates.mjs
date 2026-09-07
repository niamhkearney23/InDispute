// Finds genuinely new Malaysian court decisions and merges them into
// assets/data/court-updates-live.json, which court-updates.html fetches on
// top of its baked-in seed. Run daily by
// .github/workflows/daily-lawgistics-content.yml.
//
// Confirmed-only: the prompt requires a real source URL per case, and an
// empty result is treated as success, not a failure to paper over. This
// mirrors the standing rule elsewhere in this codebase that AI drafts and
// nothing publishes to a real person's screen unverified — there is no
// lawyer sign-off step here yet, so the page keeps its own
// "AI-drafted, pending lawyer verification" notice regardless of source.
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { research } from "./lib/research.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "assets", "data", "court-updates-live.json");
const MAX_CASES = 200;
const LOOKBACK_DAYS = 4;

const SYSTEM = `You are researching real, verifiable Malaysian court decisions for a
legal information site. Only report a case if you can point to a real,
currently-live source URL for it. Never invent a case, a citation, a suit
number, or a quote. If your search turns up nothing genuinely new and
verifiable, return an empty array — that is a correct answer, not a failure.`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const prompt = `Search malaysia.gov.my's court case judgment search, the
e-Kehakiman portal (kehakiman.gov.my, ekss-portal.kehakiman.gov.my), and
malaysiacaselaw.com for Malaysian court decisions (Federal Court, Court of
Appeal, or High Court) that were published or reported in roughly the last
${LOOKBACK_DAYS} days. For each one you can verify against a real source,
write a plain-language summary.

Respond with ONLY a single fenced \`\`\`json code block containing a JSON
array (empty if nothing verifiable was found). Each element:
{
  "title": "Party v Party",
  "suit": "the real suit/case number",
  "court": "full court name and division, as in the judgment",
  "coram": "judge name and title",
  "date": "YYYY-MM-DD",
  "dateRaw": "human date, e.g. 6 August 2026",
  "category": "one of: Criminal, Civil, Commercial, Family, Constitutional, Administrative",
  "outcome": "one or two sentences, the actual holding/order",
  "summary": "a full plain-language paragraph of the facts and reasoning",
  "keyPoint": "one sentence: the legal principle this case stands for",
  "plain": "a second, even simpler paragraph explaining it to a non-lawyer",
  "source": "the real URL you found this at"
}`;

  const found = await research({
    system: SYSTEM,
    prompt,
    allowedDomains: [
      "malaysia.gov.my",
      "kehakiman.gov.my",
      "ekss-portal.kehakiman.gov.my",
      "malaysiacaselaw.com",
    ],
    maxUses: 10,
  });

  if (!Array.isArray(found)) {
    throw new Error("Expected a JSON array from research(), got: " + typeof found);
  }

  const existing = JSON.parse(await readFile(DATA_PATH, "utf8"));
  const knownSuits = new Set(existing.cases.map((c) => c.suit));

  const added = found.filter((c) => c && c.suit && c.source && !knownSuits.has(c.suit));

  const merged = {
    generatedDate: todayIso(),
    cases: [...added, ...existing.cases].slice(0, MAX_CASES),
  };

  await writeFile(DATA_PATH, JSON.stringify(merged, null, 2) + "\n");

  console.log(
    `Court updates: found ${found.length}, added ${added.length} new, ` +
    `${merged.cases.length} total kept.`
  );
}

main().catch((err) => {
  console.error("daily-court-updates failed:", err);
  process.exit(1);
});
