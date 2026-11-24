import Anthropic from "@anthropic-ai/sdk";

export type Provider = "openai" | "anthropic";

export function openaiBase(): string {
  return (process.env.OPENAI_API_BASE || "https://api.openai.com").replace(/\/+$/, "");
}

// A rejected key is not a reason to show anyone an error message. OpenAI's own wording
// includes the last characters of the key it was sent, and that was reaching the browser.
// An auth failure is therefore a typed error with a fixed, harmless message.
export class ProviderAuthError extends Error {
  provider: Provider;
  constructor(provider: Provider) {
    super(`The ${provider === "openai" ? "ChatGPT" : "Claude"} service rejected its access key.`);
    this.provider = provider;
  }
}

/** An upstream failure that is not a rejected key. Its message is ours, never the provider's text. */
export class ProviderError extends Error {
  status: number;
  constructor(status: number) {
    super(
      status === 429
        ? "The AI service is busy or rate limited right now. Try again in a minute."
        : status === 400 || status === 413 || status === 422
          ? "The AI service could not process that request. Try a shorter or simpler one."
          : status >= 500
            ? "The AI service is having trouble right now. Try again in a minute."
            : `The AI service returned an error (code ${status}).`,
    );
    this.status = status;
  }
}

/**
 * Anything that goes back to a browser passes through this first. Only text we wrote ourselves is
 * shown. A provider's own error text can echo part of a prompt or a key, so it never leaves the server.
 */
export function safeMessage(err: unknown, fallback = "the request failed"): string {
  if (err instanceof ProviderAuthError) {
    return `${err.message} Whoever runs this studio needs to replace it.`;
  }
  if (err instanceof ProviderError) return err.message;
  return `Something went wrong: ${fallback}. Try again.`;
}

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
    const res = await fetch(`${openaiBase()}/v1/models`, {
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
  const res = await fetch(`${openaiBase()}/v1/chat/completions`, {
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
  if (res.status === 401 || res.status === 403) throw new ProviderAuthError("openai");
  if (!res.ok) throw new ProviderError(res.status);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError(502);
  return text;
}

async function withAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const anthropic = new Anthropic();
  const response = await anthropic
    .messages.create({
      model: "claude-opus-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    })
    .catch((e: { status?: number }) => {
      if (e && (e.status === 401 || e.status === 403)) throw new ProviderAuthError("anthropic");
      throw typeof e?.status === "number" ? new ProviderError(e.status) : e;
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

/**
 * Writes with the chosen provider. If that provider's key is REJECTED (401 or 403, which
 * never costs anything) and the other one has a key, writes with the other and says so.
 * Only an authentication failure falls back: a timeout or a busy model is not a reason to
 * quietly spend on a different provider than the one the owner chose.
 */
export async function draftWithFallback(
  first: Provider,
  prompt: string,
  maxTokens = 8000,
  json = false,
): Promise<{ text: string; provider: Provider; fellBack: boolean }> {
  try {
    return { text: await draftText(first, prompt, maxTokens, json), provider: first, fellBack: false };
  } catch (err) {
    const other: Provider = first === "openai" ? "anthropic" : "openai";
    if (err instanceof ProviderAuthError && hasKey(other)) {
      return { text: await draftText(other, prompt, maxTokens, json), provider: other, fellBack: true };
    }
    throw err;
  }
}

// ---- are the keys actually good? ------------------------------------------------
// /api/setup used to say a key was "set". A key can be set and wrong, which is exactly
// what drafting failed on. This asks each provider a free question (list models) and
// remembers the answer for five minutes so a page refresh cannot become a flood.

export type KeyState = "ok" | "rejected" | "unreachable" | "absent";
let keyCache: { at: number; value: { openai: KeyState; anthropic: KeyState } } | null = null;

async function ask(url: string, headers: Record<string, string>): Promise<KeyState> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(url, { headers, signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) return "ok";
    return r.status === 401 || r.status === 403 ? "rejected" : "unreachable";
  } catch {
    return "unreachable";
  }
}

export async function checkKeys(): Promise<{ openai: KeyState; anthropic: KeyState }> {
  if (keyCache && Date.now() - keyCache.at < 5 * 60_000) return keyCache.value;
  const [openai, anthropic] = await Promise.all([
    hasKey("openai")
      ? ask(`${openaiBase()}/v1/models`, { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` })
      : Promise.resolve<KeyState>("absent"),
    hasKey("anthropic")
      ? ask(`${(process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "")}/v1/models`, {
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        })
      : Promise.resolve<KeyState>("absent"),
  ]);
  keyCache = { at: Date.now(), value: { openai, anthropic } };
  return keyCache.value;
}
