import { useTransactions } from '@/hooks/useTransactions';
import { todayKstDayKey } from '@/utils/kstDate';
import { groupByDay } from '../_utils/groupByDay';

export function usePendingDays() {
  const { transactions, isLoading, refetch } = useTransactions({ status: 'pending' });
  const days = groupByDay(transactions, todayKstDayKey());
  const total = days.reduce((sum, d) => sum + d.total, 0);
  return { days, count: transactions.length, total, isLoading, refetch };
}
