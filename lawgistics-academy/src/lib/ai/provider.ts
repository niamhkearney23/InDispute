import 'server-only';

import { aiEnv } from '@/lib/env';

/**
 * Provider abstraction. Nothing above this file knows which vendor is in play,
 * and nothing above this file breaks when the answer is "none".
 */

export interface CompletionRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<string>;
}

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
} as const;

const anthropicProvider: AiProvider = {
  name: 'anthropic',
  async complete({ system, prompt, maxTokens = 400, temperature = 0.3 }) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': aiEnv.anthropicApiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: aiEnv.model ?? DEFAULT_MODELS.anthropic,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    const body = (await response.json()) as { content?: Array<{ text?: string }> };
    return body.content?.map((part) => part.text ?? '').join('').trim() ?? '';
  },
};

const openaiProvider: AiProvider = {
  name: 'openai',
  async complete({ system, prompt, maxTokens = 400, temperature = 0.3 }) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${aiEnv.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: aiEnv.model ?? DEFAULT_MODELS.openai,
        max_completion_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return body.choices?.[0]?.message?.content?.trim() ?? '';
  },
};

export function isAiEnabled(): boolean {
  if (aiEnv.provider === 'anthropic') return Boolean(aiEnv.anthropicApiKey);
  if (aiEnv.provider === 'openai') return Boolean(aiEnv.openaiApiKey);
  return false;
}

export function getProvider(): AiProvider | null {
  if (!isAiEnabled()) return null;
  return aiEnv.provider === 'anthropic' ? anthropicProvider : openaiProvider;
}
