const ACCOUNT_PATTERNS = [
  /\d{2,6}-[\d*]+-\d*(\d{4})(?!\d)/,
  /\*{2,}(\d{4})(?!\d)/,
  /\((\d{4})\)/,
];

export function extractAccountLast4(text: string): string | null {
  for (const pattern of ACCOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
