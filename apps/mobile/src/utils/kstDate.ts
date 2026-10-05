const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const pad = (n: number) => String(n).padStart(2, '0');
const toKst = (iso: string) => new Date(Date.parse(iso) + KST_OFFSET_MS);

/** KST 기준 달력 날짜 'YYYY-MM-DD' */
export function kstDayKey(iso: string): string {
  const d = toKst(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function kstTime(iso: string): string {
  const d = toKst(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function todayKstDayKey(now = new Date()): string {
  return kstDayKey(now.toISOString());
}

export function dayLabel(dayKey: string, todayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number) as [number, number, number];
  const date = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((Date.parse(`${todayKey}T00:00:00Z`) - date) / DAY_MS);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${month}월 ${day}일 (${WEEKDAYS[new Date(date).getUTCDay()]})`;
}

/** KST 한 달을 감싸는 UTC 시각 범위 [from, to) */
export function kstMonthRange(year: number, month: number): { from: string; to: string } {
  return {
    from: new Date(Date.UTC(year, month - 1, 1) - KST_OFFSET_MS).toISOString(),
    to: new Date(Date.UTC(year, month, 1) - KST_OFFSET_MS).toISOString(),
  };
}
