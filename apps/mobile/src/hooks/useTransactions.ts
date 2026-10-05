import { useQuery } from '@tanstack/react-query';
import { getTransactions, type TransactionDTO } from '@/apis/transactions';
import type { TransactionStatus } from '@/types/transaction';
import { toTransaction } from '@/utils/toTransaction';

export type TransactionFilter = { status: 'pending' | 'mine' | 'group' | 'hidden'; from?: string; to?: string; groupId?: string };

export const transactionsKey = (filter: TransactionFilter) => ['transactions', filter] as const;

const STATUSES_BY_FILTER: Record<TransactionFilter['status'], TransactionStatus[]> = {
  pending: ['pending'],
  mine: ['mine'],
  group: ['group'],
  hidden: ['ignored', 'auto_hidden'],
};

/** 상태별 결제 건. 낙관적 업데이트로 상태가 바뀐 건은 목록에서 바로 빠진다 */
export function useTransactions(filter: TransactionFilter) {
  const query = useQuery<TransactionDTO[]>({ queryKey: transactionsKey(filter), queryFn: () => getTransactions(filter) });
  const allowed = STATUSES_BY_FILTER[filter.status];
  const transactions = (query.data ?? [])
    .filter((dto) => allowed.includes(dto.status as TransactionStatus) && (!filter.groupId || dto.group_id === filter.groupId))
    .map(toTransaction);
  return { transactions, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}
