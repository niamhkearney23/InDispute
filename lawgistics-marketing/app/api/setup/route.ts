import { NextResponse } from "next/server";
import { pickProvider } from "@/lib/provider";

export const runtime = "nodejs";

// Says which keys the server can see and what they switch on. It reports
// booleans only and never any part of a key, so it is safe to open in a
// browser. It exists because there is no other way to tell from the app
// whether a key you pasted into a hosting dashboard actually arrived.
export async function GET() {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const pinned = (process.env.DRAFT_PROVIDER || "").toLowerCase();
  const writing = pickProvider();

  const notes: string[] = [];
  if (!hasAnthropic && !hasOpenAI) {
    notes.push("No key is set, so nothing can be drafted. Add ANTHROPIC_API_KEY or OPENAI_API_KEY.");
  }
  if (hasAnthropic && hasOpenAI && !pinned) {
    notes.push(
      "Both keys are set, so the Written by switch on the topic screen chooses per post. " +
        "Anthropic is the default when nothing is chosen. DRAFT_PROVIDER is not needed, " +
        "though setting it would change that default.",
    );
  }
  if (pinned === "openai" && !hasOpenAI) {
    notes.push("DRAFT_PROVIDER is openai but OPENAI_API_KEY is missing, so drafting will fail.");
  }
  if (pinned === "anthropic" && !hasAnthropic) {
    notes.push("DRAFT_PROVIDER is anthropic but ANTHROPIC_API_KEY is missing, so drafting will fail.");
  }
  if (!hasOpenAI) {
    notes.push("Photos and generated backgrounds need OPENAI_API_KEY and are off without it.");
  }
  if (!notes.length) notes.push("Everything the app needs is set.");

  return NextResponse.json(
    {
      ok: !!writing,
      keys: { anthropic: hasAnthropic, openai: hasOpenAI },
      draftProvider: pinned || "(not pinned)",
      writingWith: writing || "nothing",
      imagesAvailable: hasOpenAI,
      notes,
      deployedCommit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "(unknown)",
      deployedBranch: process.env.VERCEL_GIT_COMMIT_REF || "(unknown)",
      environment: process.env.VERCEL_ENV || "(not on Vercel)",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
