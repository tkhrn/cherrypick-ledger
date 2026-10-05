import { describe, expect, it, vi } from 'vitest';
import { AiRateLimitError } from '../../src/ai/types.ts';
import { createGeminiClient } from '../../src/ai/gemini.ts';

const items = [{ id: 'a', text: 'KB국민카드\n승인 7,800원', needsParse: true, needsCategory: true }];
const categories = ['식비', '카페·간식'];

function geminiResponse(text: string, status = 200) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }], role: 'model' } }],
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30 },
    }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

describe('createGeminiClient', () => {
  it('sends a structured-output request and returns validated outputs with usage', async () => {
    const fetchFn = vi.fn(async () => geminiResponse(JSON.stringify({ items: [{ id: 'a', kind: 'payment', merchant: '한솥도시락', category: '식비' }] })));
    const client = createGeminiClient({ apiKey: 'k', model: 'gemini-test', fetchFn });

    const result = await client.analyze(items, categories);

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('k');
    const body = JSON.parse(String(init.body));
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema.type).toBe('OBJECT');
    expect(body.contents[0].parts[0].text).toContain('KB국민카드');
    expect(result.outputs).toEqual([{ id: 'a', kind: 'payment', merchant: '한솥도시락', category: '식비' }]);
    expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 30 });
  });

  it('throws AiRateLimitError on HTTP 429', async () => {
    const client = createGeminiClient({ apiKey: 'k', model: 'm', fetchFn: async () => new Response('{}', { status: 429 }) });
    await expect(client.analyze(items, categories)).rejects.toBeInstanceOf(AiRateLimitError);
  });

  it('throws on other HTTP errors', async () => {
    const client = createGeminiClient({ apiKey: 'k', model: 'm', fetchFn: async () => new Response('{}', { status: 500 }) });
    await expect(client.analyze(items, categories)).rejects.toThrow('Gemini request failed: 500');
  });

  it('returns no outputs for a truncated JSON body', async () => {
    const client = createGeminiClient({ apiKey: 'k', model: 'm', fetchFn: async () => geminiResponse('{"items": [{"id": "a", "mer') });
    const result = await client.analyze(items, categories);
    expect(result.outputs).toEqual([]);
  });

  it('skips the request when there is nothing to analyze', async () => {
    const fetchFn = vi.fn();
    const client = createGeminiClient({ apiKey: 'k', model: 'm', fetchFn });
    expect(await client.analyze([], categories)).toEqual({ outputs: [], usage: { inputTokens: 0, outputTokens: 0 } });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
