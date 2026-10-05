import { dayLabel, kstDayKey } from '@/utils/kstDate';

interface Dated {
  id: string;
  occurredAt: string;
  amount: number | null;
  cancelledAt: string | null;
}

export interface DayGroup<T> {
  dayKey: string;
  label: string;
  total: number;
  items: T[];
}

/** KST 날짜별 묶음. 최신 날짜·최신 건이 먼저, 합계는 취소 건 제외 */
export function groupByDay<T extends Dated>(items: T[], todayKey: string): DayGroup<T>[] {
  const sorted = [...items].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const groups = new Map<string, T[]>();
  for (const item of sorted) {
    const key = kstDayKey(item.occurredAt);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups].map(([dayKey, dayItems]) => ({
    dayKey,
    label: dayLabel(dayKey, todayKey),
    total: dayItems.reduce((sum, i) => sum + (i.cancelledAt ? 0 : (i.amount ?? 0)), 0),
    items: dayItems,
  }));
}
