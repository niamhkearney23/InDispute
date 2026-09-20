import Anthropic from "@anthropic-ai/sdk";

export type Provider = "openai" | "anthropic";

// Either provider can write. DRAFT_PROVIDER pins one; otherwise whichever key
// is present wins, so the app works with just one of them set.
export function pickProvider(): Provider | null {
  const pinned = (process.env.DRAFT_PROVIDER || "").toLowerCase();
  if (pinned === "openai") return process.env.OPENAI_API_KEY ? "openai" : null;
  if (pinned === "anthropic") return process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
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
