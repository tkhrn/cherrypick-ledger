import { AI_RESPONSE_SCHEMA, buildPrompt } from './prompt.ts';
import { AiRateLimitError, type AiClient, type AiParseItem } from './types.ts';
import { validateAiOutputs } from './validate.ts';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 20_000;
const HTTP_TOO_MANY_REQUESTS = 429;
const MAX_REQUEST_TRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1_000;

interface GeminiOptions {
  apiKey: string;
  model: string;
  fetchFn?: typeof fetch;
  /** 한 번 더 시도하기 전 대기 시간 */
  retryDelayMs?: number;
}

class RetryableError extends Error {}

const MAX_ERROR_DETAIL_LENGTH = 200;

/** 실패 응답의 Google 오류 상태·메시지 (요청 내용은 담기지 않는다) */
async function failureMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
  const detail = [body?.error?.status, body?.error?.message].filter(Boolean).join(' ').slice(0, MAX_ERROR_DETAIL_LENGTH);
  return detail ? `Gemini request failed: ${res.status} ${detail}` : `Gemini request failed: ${res.status}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isTimeout = (error: unknown) => error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

/** 시간 초과와 서버 오류(5xx, 과부하)는 한 번 더 시도한다. 그 밖의 실패는 바로 던진다 */
async function withRetry<T>(attempt: () => Promise<T>, retryDelayMs: number): Promise<T> {
  for (let tryCount = 1; ; tryCount++) {
    try {
      return await attempt();
    } catch (error) {
      const retryable = error instanceof RetryableError || isTimeout(error);
      if (!retryable || tryCount >= MAX_REQUEST_TRIES) throw error;
      await sleep(retryDelayMs);
    }
  }
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

export function createGeminiClient({ apiKey, model, fetchFn = fetch, retryDelayMs = DEFAULT_RETRY_DELAY_MS }: GeminiOptions): AiClient {
  return {
    async analyze(items: AiParseItem[], categoryNames: string[]) {
      if (items.length === 0) return { outputs: [], usage: { inputTokens: 0, outputTokens: 0 } };

      const request = () => fetchFn(`${GEMINI_BASE_URL}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(items, categoryNames) }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: AI_RESPONSE_SCHEMA, temperature: 0 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const response = await withRetry(async () => {
        const res = await request();
        if (res.status >= 500) throw new RetryableError(await failureMessage(res));
        return res;
      }, retryDelayMs);
      if (response.status === HTTP_TOO_MANY_REQUESTS) throw new AiRateLimitError();
      if (!response.ok) throw new Error(await failureMessage(response));

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
