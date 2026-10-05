import { useState } from 'react';
import { kstMonthRange, todayKstDayKey } from '@/utils/kstDate';

const MONTHS_IN_YEAR = 12;

function currentMonth() {
  const [year, month] = todayKstDayKey().split('-').map(Number) as [number, number];
  return { year, month };
}

/** 화면에서 보고 있는 달. 지역 상태 */
export function useMonthCursor() {
  const [cursor, setCursor] = useState(currentMonth);
  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const index = year * MONTHS_IN_YEAR + (month - 1) + delta;
      return { year: Math.floor(index / MONTHS_IN_YEAR), month: (index % MONTHS_IN_YEAR) + 1 };
    });
  return { ...cursor, range: kstMonthRange(cursor.year, cursor.month), prev: () => shift(-1), next: () => shift(1) };
}
