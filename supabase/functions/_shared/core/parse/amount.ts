const AMOUNT_PATTERN = /KRW\s*(\d{1,3}(?:,\d{3})+|\d+)(?![\d,])|(\d{1,3}(?:,\d{3})+|\d+)\s*원/g;
const NON_PAYMENT_PREFIX = /누적|잔액|한도|가능|포인트/;
const PREFIX_WINDOW = 6;

export function extractAmount(text: string): number | null {
  for (const match of text.matchAll(AMOUNT_PATTERN)) {
    const prefix = text.slice(Math.max(0, match.index - PREFIX_WINDOW), match.index);
    if (NON_PAYMENT_PREFIX.test(prefix)) continue;
    const digits = (match[1] ?? match[2] ?? '').replaceAll(',', '');
    const amount = Number(digits);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  return null;
}
