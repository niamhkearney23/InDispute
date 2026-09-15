// Shared research helper. Runs one turn with Claude's web_search tool and
// returns parsed JSON. No structured-outputs dependency, just "answer in one
// fenced ```json block" plus a strict parser, because this runs unattended
// and a crash should be loud, not silently produce bad output.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";

export function client() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it under this repo's " +
      "Settings -> Secrets and variables -> Actions -> New repository secret."
    );
  }
  return new Anthropic();
}

function extractJson(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  return JSON.parse(raw.trim());
}

// Runs a research turn with web_search enabled, resuming through pause_turn
// if the model needs more than one round of searching, and returns the
// parsed JSON from its final answer. Throws rather than guessing if the
// final text isn't valid JSON.
export async function research({ system, prompt, allowedDomains, maxUses = 10 }) {
  const anthropic = client();
  const tools = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: maxUses,
      ...(allowedDomains ? { allowed_domains: allowedDomains } : {}),
    },
  ];

  let messages = [{ role: "user", content: prompt }];
  let response;
  for (let i = 0; i < 8; i++) {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools,
      messages,
    });
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    break;
  }

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJson(text);
}
