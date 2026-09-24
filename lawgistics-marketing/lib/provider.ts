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

async function withOpenAI(prompt: string, maxTokens: number, json: boolean): Promise<string> {
  const model = process.env.OPENAI_DRAFT_MODEL || "gpt-4o";
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
