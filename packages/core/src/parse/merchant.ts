import type { EventKind } from '../types.ts';

const MAX_MERCHANT_LENGTH = 40;
const SOURCE_TAG = /^\s*\[[^\]]*\]\s*/;

// 은행 출금 문자: "출금 100,000원 토뱅 이장춘 잔액 200,000원" (받는 쪽이 금액과 잔액 사이에 있다)
const TRANSFER_PATTERNS = [/(\S+?)님(?:에게|께)/, /받는\s?분\s*:?\s*(\S+)/, /출금\s*[\d,]+\s*원\s+(.+?)\s+잔액/];
const PAYMENT_PATTERNS = [/^(.+?)에서\s*[\d,]+\s*원/, /[\d,]+\s*원\s+(\S+)\s+(?:승인|결제)/];
// "에서" 앞에서 가게 이름이 아닌 단어(금액·카드 승인 문구·마스킹된 이름 등)를 만나면 거기서 끊는다
const NOT_MERCHANT_WORD = /[\d*\]]|원$|승인|결제|일시불|할부|발신/;
const MAX_MERCHANT_WORDS = 3;

const NOISE_LINE = /Web발신|승인|취소|원|누적|잔액|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}|\*/;

function trailingMerchantWords(value: string): string {
  const words = value.trim().split(/\s+/);
  const picked: string[] = [];
  for (let i = words.length - 1; i >= 0 && picked.length < MAX_MERCHANT_WORDS; i--) {
    const word = words[i]!;
    if (NOT_MERCHANT_WORD.test(word)) break;
    picked.unshift(word);
  }
  return picked.join(' ');
}

function clean(value: string): string | null {
  const trimmed = value.replace(SOURCE_TAG, '').replace(/\s+/g, ' ').trim();
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
      if (match?.[1]) return clean(pattern === PAYMENT_PATTERNS[0] ? trailingMerchantWords(match[1]) : match[1]);
    }
  }
  return lastMeaningfulLine(text);
}
