// 돈을 받는 쪽을 가리키는 표현. 이 뒤에 나오는 계좌만 상대 계좌로 본다.
// (출금 문자에 찍힌 계좌는 보내는 내 계좌라서 상대 계좌가 아니다)
const COUNTERPARTY_MARKER = /입금\s?계좌|받는\s?(?:분|계좌|사람)|→/;
const MAX_MARKER_DISTANCE = 30;

const ACCOUNT_PATTERNS = [
  /\d{2,6}-[\d*]+-\d*(\d{4})(?!\d)/,
  /\*{2,}(\d{4})(?!\d)/,
];

export function extractAccountLast4(text: string): string | null {
  const marker = COUNTERPARTY_MARKER.exec(text);
  if (!marker) return null;
  const afterMarker = text.slice(marker.index + marker[0].length, marker.index + marker[0].length + MAX_MARKER_DISTANCE);
  for (const pattern of ACCOUNT_PATTERNS) {
    const match = afterMarker.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
