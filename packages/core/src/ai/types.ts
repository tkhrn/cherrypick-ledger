import type { EventKind } from '../types.ts';

export interface AiParseItem {
  id: string;
  text: string;
  needsParse: boolean;
  needsCategory: boolean;
}

export interface AiParseOutput {
  id: string;
  kind?: EventKind;
  merchant?: string | null;
  accountLast4?: string | null;
  category?: string | null;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiClient {
  analyze(items: AiParseItem[], categoryNames: string[]): Promise<{ outputs: AiParseOutput[]; usage: AiUsage }>;
}

export class AiRateLimitError extends Error {
  constructor() {
    super('AI rate limit reached');
    this.name = 'AiRateLimitError';
  }
}
