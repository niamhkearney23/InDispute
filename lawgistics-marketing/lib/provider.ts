import Anthropic from "@anthropic-ai/sdk";

export type Provider = "openai" | "anthropic";

// Either provider can write. DRAFT_PROVIDER pins one; otherwise whichever key
// is present wins, so the app works with just one of them set.
export function hasKey(p: Provider): boolean {
  return p === "openai" ? !!process.env.OPENAI_API_KEY : !!process.env.ANTHROPIC_API_KEY;
}

// `asked` is the choice made in the app for this one request. It only ever
// names a provider, never carries a key, and it is ignored unless that
// provider's key is actually on the server. DRAFT_PROVIDER still pins a
// default for anyone who would rather set it once in the dashboard.
export function pickProvider(asked?: string | null): Provider | null {
  const want = (asked || "").toLowerCase();
  if (want === "openai" && hasKey("openai")) return "openai";
  if (want === "anthropic" && hasKey("anthropic")) return "anthropic";

  const pinned = (process.env.DRAFT_PROVIDER || "").toLowerCase();
  if (pinned === "openai") return hasKey("openai") ? "openai" : null;
  if (pinned === "anthropic") return hasKey("anthropic") ? "anthropic" : null;
  // OpenAI first by default: Niamh wants ChatGPT choosing the compositions.
  // Anthropic stays as the fallback and as a choice in the app.
  if (hasKey("openai")) return "openai";
  if (hasKey("anthropic")) return "anthropic";
  return null;
}

// Which OpenAI model to use. Rather than hardcoding a name that goes stale, or
// guessing at one that may not exist on this account, ask the account what it
// has and take the best of it. Ranked by family, newest first, preferring the
// full model over its mini and nano cut-downs, which are the ones that write
// like a language model.
const FAMILY_RANK = ["gpt-5", "gpt-4.1", "gpt-4o", "o3", "gpt-4-turbo", "gpt-4"];
const NOT_CHAT = /embedding|tts|whisper|audio|realtime|moderation|dall-e|image|transcribe|search|codex/i;

function scoreModel(id: string): number {
  if (NOT_CHAT.test(id)) return -1;
  const family = FAMILY_RANK.findIndex((f) => id.startsWith(f));
  if (family < 0) return -1;
  let score = (FAMILY_RANK.length - family) * 100;
  if (/-(mini|nano)\b/.test(id)) score -= 40;      // cheaper, and it shows in the writing
  if (/-\d{4}-\d{2}-\d{2}$/.test(id)) score -= 5; // prefer the rolling alias to a dated snapshot
  if (/preview/.test(id)) score -= 10;
  return score;
}

let cachedModel: string | null = null;
export async function resolveOpenAIModel(): Promise<string> {
  const pinned = process.env.OPENAI_DRAFT_MODEL;
  if (pinned) return pinned;
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    const data = (await res.json()) as { data?: { id?: string }[] };
    const best = (data.data || [])
      .map((m) => String(m.id || ""))
      .filter(Boolean)
      .map((id) => ({ id, score: scoreModel(id) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score || a.id.length - b.id.length)[0];
    cachedModel = best ? best.id : "gpt-4o";
  } catch {
    cachedModel = "gpt-4o";
  }
  return cachedModel;
}

async function withOpenAI(prompt: string, maxTokens: number, json: boolean): Promise<string> {
  const model = await resolveOpenAIModel();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
      max_completion_tokens: maxTokens,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(data.error?.message || `OpenAI request failed (${res.status})`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned nothing");
  return text;
}

async function withAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");
}

export async function draftText(
  provider: Provider,
  prompt: string,
  maxTokens = 8000,
  json = false,
): Promise<string> {
  return provider === "openai" ? withOpenAI(prompt, maxTokens, json) : withAnthropic(prompt, maxTokens);
}
