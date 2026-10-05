const wonFormatter = new Intl.NumberFormat('ko-KR');

export function formatWon(amount: number | null): string {
  if (amount === null) return '—';
  return `${wonFormatter.format(amount)}원`;
}
