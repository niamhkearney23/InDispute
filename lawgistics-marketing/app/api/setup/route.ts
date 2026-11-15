import { NextResponse } from "next/server";
import { checkKeys, pickProvider, resolveOpenAIModel } from "@/lib/provider";
import { bookingUrl } from "@/lib/booking";
import { emailStatus } from "@/lib/firm/email";
import { accessRequired } from "@/lib/access";
import { firmStatus } from "@/lib/firm/db";

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
  // "set" is not the same as "works": ask each provider whether it accepts its key
  const checks = await checkKeys().catch(() => ({ openai: "unreachable" as const, anthropic: "unreachable" as const }));
  const openaiModel = hasOpenAI ? await resolveOpenAIModel().catch(() => "(could not ask OpenAI)") : "(no key)";

  const notes: string[] = [];
  if (!hasAnthropic && !hasOpenAI) {
    notes.push("No key is set, so nothing can be drafted. Add ANTHROPIC_API_KEY or OPENAI_API_KEY.");
  }
  if (hasAnthropic && hasOpenAI && !pinned) {
    notes.push(
      "Both keys are set. OpenAI is the default, and the Written by switch on the topic " +
        "screen can send a single post to Anthropic instead. DRAFT_PROVIDER is not needed, " +
        "though setting it would change the default.",
    );
  }
  if (pinned === "openai" && !hasOpenAI) {
    notes.push("DRAFT_PROVIDER is openai but OPENAI_API_KEY is missing, so drafting will fail.");
  }
  if (pinned === "anthropic" && !hasAnthropic) {
    notes.push("DRAFT_PROVIDER is anthropic but ANTHROPIC_API_KEY is missing, so drafting will fail.");
  }
  if (!accessRequired()) {
    notes.push(
      "The studio is open to anyone with the link, and every post they make is paid for by your model accounts. " +
        "Set ACCESS_CODES to a comma separated list of codes to make it invite only.",
    );
  }
  if (checks.openai === "rejected") {
    notes.push(
      "OpenAI REJECTED the OPENAI_API_KEY on this server, so ChatGPT cannot write and photos cannot be made. " +
        (checks.anthropic === "ok"
          ? "Drafting is falling back to Claude automatically until the key is replaced. "
          : "") +
        "Create a new key at platform.openai.com, replace it in the hosting dashboard, and redeploy.",
    );
  }
  if (checks.anthropic === "rejected") {
    notes.push("Anthropic REJECTED the ANTHROPIC_API_KEY on this server. Replace it in the hosting dashboard and redeploy.");
  }
  if (checks.openai === "unreachable" || checks.anthropic === "unreachable") {
    notes.push("Could not reach one of the model providers to test its key just now. That is not necessarily a problem with the key.");
  }
  if (!hasOpenAI) {
    notes.push("Photos and generated backgrounds need OPENAI_API_KEY and are off without it.");
  }
  if (!bookingUrl()) {
    notes.push("BOOKING_URL is not set, so the Book a demo buttons on /firms are left out. Set it to your Calendly or form link.");
  }
  if (!notes.length) notes.push("Everything the app needs is set.");

  return NextResponse.json(
    {
      ok: !!writing,
      keys: { anthropic: hasAnthropic, openai: hasOpenAI },
      draftProvider: pinned || "(not pinned)",
      writingWith: writing || "nothing",
      imagesAvailable: hasOpenAI && checks.openai !== "rejected",
      keyChecks: checks,
      email: emailStatus().ok ? { configured: true } : { configured: false, reason: emailStatus().ok ? "" : (emailStatus() as { reason: string }).reason },
      bookingUrl: bookingUrl(),
      accessRequired: accessRequired(),
      firm: (() => {
        const f = firmStatus();
        return f.ok ? { configured: true } : { configured: false, reason: f.reason };
      })(),
      openaiModel,
      notes,
      deployedCommit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "(unknown)",
      deployedBranch: process.env.VERCEL_GIT_COMMIT_REF || "(unknown)",
      environment: process.env.VERCEL_ENV || "(not on Vercel)",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
