// Finds real, currently-relevant Australian law clerkship / graduate program
// application windows and writes them to assets/data/jobs-live.json, which
// jobs.html reads. Run daily by
// .github/workflows/daily-lawgistics-content.yml.
//
// Same confirmed-only rule as the court updates script: a date only appears
// here if a named official source states it. A firm whose page doesn't give
// exact dates yet is still listed (so students know to watch it) with
// opens/closes left null rather than guessed.
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { research } from "./lib/research.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "assets", "data", "jobs-live.json");
const MAX_JOBS = 80;

const SYSTEM = `You are researching real, currently-published Australian law
clerkship and graduate program application windows for a legal information
site read by law students. Only report a listing if you have a real,
currently-live official source URL for it (a Law Society recruitment scheme
page, or the firm's own careers page) — never a jobs-board aggregator, and
never a rumour or a past year's date reused as if current. If you cannot
confirm exact open/close dates from the source, still list the program with
"opens" and "closes" set to null and say so in "notes" — do not guess a date.
If nothing can be verified, return an empty array.`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const prompt = `Check the official Law Society clerkship/graduate
recruitment scheme pages for NSW, VIC, QLD, WA and SA, and the graduate
careers pages of major national and international firms with an Australian
practice (e.g. Herbert Smith Freehills Kramer, Allens, Ashurst, MinterEllison,
King & Wood Mallesons, Clayton Utz, Corrs, Gilbert + Tobin, DLA Piper,
Gadens). Find seasonal clerkship or graduate program application windows that
are either currently open or have a confirmed future open date.

Respond with ONLY a single fenced \`\`\`json code block containing a JSON
array (empty if nothing verifiable was found). Each element:
{
  "employer": "firm or organisation name",
  "program": "e.g. Summer Clerkship 2027, Graduate Program 2027",
  "jurisdiction": "e.g. NSW, VIC, National",
  "opens": "YYYY-MM-DD or null if not confirmed",
  "closes": "YYYY-MM-DD or null if not confirmed",
  "notes": "one sentence — eligibility, intake timing, or why dates are null",
  "url": "the real official source URL",
  "verifiedDate": "${todayIso()}"
}`;

  const found = await research({
    system: SYSTEM,
    prompt,
    maxUses: 12,
  });

  if (!Array.isArray(found)) {
    throw new Error("Expected a JSON array from research(), got: " + typeof found);
  }

  const clean = found.filter((j) => j && j.employer && j.url);

  const merged = {
    generatedDate: todayIso(),
    jobs: clean.slice(0, MAX_JOBS),
  };

  await writeFile(DATA_PATH, JSON.stringify(merged, null, 2) + "\n");

  console.log(`Jobs: found ${found.length}, kept ${merged.jobs.length}.`);
}

main().catch((err) => {
  console.error("daily-jobs failed:", err);
  process.exit(1);
});
