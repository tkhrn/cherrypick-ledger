export const VERSION = '0.1.0';

export type { EventKind } from './types.ts';
export type { AppRule, ParsedEvent, ParseResult, RawNotification } from './parse/parseNotification.ts';
export { parseNotification } from './parse/parseNotification.ts';
export { APP_RULES } from './parse/rules.ts';
export { merchantKey } from './merchantKey.ts';
export type { AiClient, AiParseItem, AiParseOutput, AiUsage } from './ai/types.ts';
export { AiRateLimitError } from './ai/types.ts';
export { createGeminiClient } from './ai/gemini.ts';
