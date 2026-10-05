import type { CategoryColorToken } from '@/constants/theme';
import type { Category } from '@/types/transaction';
import { kstDayKey } from './kstDate';

const DAYS_IN_WEEK = 7;
const MIN_SHARE_RATIO = 0.03;
const OTHER_KEY = '__other__';

const pad = (n: number) => String(n).padStart(2, '0');

/** 7열 월 달력 칸. 빈칸은 null, 날짜는 'YYYY-MM-DD' */
export function buildMonthGrid(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(`${year}-${pad(month)}-${pad(day)}`);
  while (cells.length % DAYS_IN_WEEK !== 0) cells.push(null);
  return cells;
}

interface Spend {
  occurredAt: string;
  amount: number | null;
  cancelledAt: string | null;
}

const counted = (s: { amount: number | null; cancelledAt: string | null }) => (s.cancelledAt ? 0 : (s.amount ?? 0));

export function sumByDay(items: Spend[]): Map<string, number> {
  const sums = new Map<string, number>();
  for (const item of items) {
    const amount = counted(item);
    if (amount === 0) continue;
    const key = kstDayKey(item.occurredAt);
    sums.set(key, (sums.get(key) ?? 0) + amount);
  }
  return sums;
}

export function sumAmounts(items: { amount: number | null; cancelledAt: string | null }[]): number {
  return items.reduce((sum, i) => sum + counted(i), 0);
}

export interface CategoryShare {
  key: string;
  name: string;
  amount: number;
  ratio: number;
  colorToken: CategoryColorToken;
}

/** 카테고리별 비율. 큰 순, 3% 미만과 미분류는 '기타'로 합쳐 맨 뒤 */
export function categoryShares(items: { amount: number | null; cancelledAt: string | null; category: Category | null }[]): CategoryShare[] {
  const total = sumAmounts(items);
  if (total === 0) return [];
  const byCategory = new Map<string, CategoryShare>();
  for (const item of items) {
    const amount = counted(item);
    if (amount === 0) continue;
    const key = item.category?.id ?? OTHER_KEY;
    const current = byCategory.get(key) ?? { key, name: item.category?.name ?? '기타', amount: 0, ratio: 0, colorToken: item.category?.colorToken ?? 'cat-gray' };
    current.amount += amount;
    byCategory.set(key, current);
  }
  const shares = [...byCategory.values()].map((s) => ({ ...s, ratio: s.amount / total }));
  const major = shares.filter((s) => s.key !== OTHER_KEY && s.ratio >= MIN_SHARE_RATIO).sort((a, b) => b.amount - a.amount);
  const otherAmount = shares.filter((s) => !major.includes(s)).reduce((sum, s) => sum + s.amount, 0);
  return otherAmount > 0
    ? [...major, { key: OTHER_KEY, name: '기타', amount: otherAmount, ratio: otherAmount / total, colorToken: 'cat-gray' }]
    : major;
}

/** 비율 막대에서 고른 조각에 속한 건만 남긴다. '기타'는 작은 카테고리와 미분류를 모두 포함한다 */
export function inShare<T extends { category: Category | null }>(items: T[], shares: CategoryShare[], key: string): T[] {
  if (key !== OTHER_KEY) return items.filter((i) => i.category?.id === key);
  const majorKeys = new Set(shares.filter((s) => s.key !== OTHER_KEY).map((s) => s.key));
  return items.filter((i) => !i.category || !majorKeys.has(i.category.id));
}
