import { AI_RESPONSE_SCHEMA, buildPrompt } from './prompt.ts';
import { AiRateLimitError, type AiClient, type AiParseItem } from './types.ts';
import { validateAiOutputs } from './validate.ts';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 10_000;
const HTTP_TOO_MANY_REQUESTS = 429;

interface GeminiOptions {
  apiKey: string;
  model: string;
  fetchFn?: typeof fetch;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function createGeminiClient({ apiKey, model, fetchFn = fetch }: GeminiOptions): AiClient {
  return {
    async analyze(items: AiParseItem[], categoryNames: string[]) {
      if (items.length === 0) return { outputs: [], usage: { inputTokens: 0, outputTokens: 0 } };

      const response = await fetchFn(`${GEMINI_BASE_URL}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(items, categoryNames) }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: AI_RESPONSE_SCHEMA, temperature: 0 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === HTTP_TOO_MANY_REQUESTS) throw new AiRateLimitError();
      if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return {
        outputs: validateAiOutputs(parseJson(text), items.map((i) => i.id), categoryNames),
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    },
  };
}
