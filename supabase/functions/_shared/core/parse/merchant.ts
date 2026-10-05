import type { EventKind } from '../types.ts';

const MAX_MERCHANT_LENGTH = 40;
const SOURCE_TAG = /^\s*\[[^\]]*\]\s*/;

const TRANSFER_PATTERNS = [/(\S+?)님(?:에게|께)/, /받는\s?분\s*:?\s*(\S+)/];
const PAYMENT_PATTERNS = [/^(.+?)에서\s*[\d,]+\s*원/, /[\d,]+\s*원\s+(\S+)\s+(?:승인|결제)/];

const NOISE_LINE = /Web발신|승인|취소|원|누적|잔액|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}|\*/;

function clean(value: string): string | null {
  const trimmed = value.replace(SOURCE_TAG, '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_MERCHANT_LENGTH);
}

export function lastMeaningfulLine(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  const candidates = lines.filter((line) => !NOISE_LINE.test(line));
  const last = candidates.at(-1);
  return last ? clean(last) : null;
}

export function guessMerchant(text: string, kind: EventKind): string | null {
  const patterns = kind === 'transfer_out' ? TRANSFER_PATTERNS : PAYMENT_PATTERNS;
  for (const line of text.split('\n')) {
    for (const pattern of patterns) {
      const match = line.replace(SOURCE_TAG, '').match(pattern);
      if (match?.[1]) return clean(match[1]);
    }
  }
  return lastMeaningfulLine(text);
}
