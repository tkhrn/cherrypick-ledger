import { useTransactions } from './useTransactions';
import { kstDayKey } from '@/utils/kstDate';

/** 아직 정리할 건이 남은 날짜들 (달력 점 표시용) */
export function usePendingDayKeys(): ReadonlySet<string> {
  const { transactions } = useTransactions({ status: 'pending' });
  return new Set(transactions.map((t) => kstDayKey(t.occurredAt)));
}
