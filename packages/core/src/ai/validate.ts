import type { EventKind } from '../types.ts';
import type { AiParseOutput } from './types.ts';

const VALID_KINDS: EventKind[] = ['payment', 'transfer_out', 'cancel', 'deposit', 'unknown'];
const MAX_MERCHANT_LENGTH = 40;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function validateAiOutputs(raw: unknown, ids: string[], categoryNames: string[]): AiParseOutput[] {
  if (!isRecord(raw) || !Array.isArray(raw.items)) return [];
  const outputs: AiParseOutput[] = [];
  for (const item of raw.items) {
    if (!isRecord(item) || typeof item.id !== 'string' || !ids.includes(item.id)) continue;
    const output: AiParseOutput = { id: item.id };
    if (typeof item.kind === 'string' && VALID_KINDS.includes(item.kind as EventKind)) output.kind = item.kind as EventKind;
    if ('merchant' in item) output.merchant = typeof item.merchant === 'string' && item.merchant.trim() ? item.merchant.trim().slice(0, MAX_MERCHANT_LENGTH) : null;
    if ('accountLast4' in item) output.accountLast4 = typeof item.accountLast4 === 'string' && /^\d{4}$/.test(item.accountLast4) ? item.accountLast4 : null;
    if ('category' in item) output.category = typeof item.category === 'string' && categoryNames.includes(item.category) ? item.category : null;
    outputs.push(output);
  }
  return outputs;
}
