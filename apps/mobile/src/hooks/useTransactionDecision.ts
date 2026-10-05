import { merchantKey } from '@cherrypick/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMergedTransaction } from '@/apis/merge_transactions';
import { createSplitTransaction } from '@/apis/split_transaction';
import { updateTransactionDecision } from '@/apis/decide_transaction';
import type { CategoryDTO } from '@/apis/categories';
import type { TransactionDTO } from '@/apis/transactions';
import type { DecisionStatus, Transaction } from '@/types/transaction';

export interface Decision {
  transaction: Pick<Transaction, 'id' | 'merchant' | 'category' | 'groupId' | 'memo'>;
  status: DecisionStatus;
  categoryId?: string | null;
  groupId?: string | null;
  memo?: string | null;
}

type Snapshot = [readonly unknown[], TransactionDTO[] | undefined][];

/** 결제 건 결정(내 소비·모임장부·무시·되돌리기)과 묶음 조정(나누기·합치기) */
export function useTransactionDecision() {
  const queryClient = useQueryClient();
  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ['transactions'] });

  const decide = useMutation({
    mutationFn: ({ transaction, status, categoryId, groupId, memo }: Decision) =>
      updateTransactionDecision({
        id: transaction.id,
        status,
        categoryId: categoryId ?? transaction.category?.id ?? null,
        groupId: status === 'group' ? (groupId ?? transaction.groupId) : null,
        memo: memo ?? null,
        merchantKey: transaction.merchant ? merchantKey(transaction.merchant) : null,
      }),
    onMutate: async ({ transaction, status, categoryId, groupId }): Promise<Snapshot> => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const snapshot = queryClient.getQueriesData<TransactionDTO[]>({ queryKey: ['transactions'] });
      const nextCategory = categoryId ? queryClient.getQueryData<CategoryDTO[]>(['categories'])?.find((c) => c.id === categoryId) : undefined;
      queryClient.setQueriesData<TransactionDTO[]>({ queryKey: ['transactions'] }, (rows) =>
        rows?.map((row) => {
          if (row.id !== transaction.id) return row;
          return {
            ...row,
            status,
            group_id: status === 'group' ? (groupId ?? row.group_id) : null,
            category: nextCategory ? { id: nextCategory.id, name: nextCategory.name, icon: nextCategory.icon, color_token: nextCategory.color_token } : row.category,
          };
        }),
      );
      return snapshot;
    },
    onError: (_error, _decision, snapshot) => snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: refreshAll,
  });

  const split = useMutation({
    mutationFn: ({ transactionId, eventIds }: { transactionId: string; eventIds: string[] }) => createSplitTransaction(transactionId, eventIds),
    onSettled: refreshAll,
  });

  const merge = useMutation({
    mutationFn: ({ targetId, sourceId }: { targetId: string; sourceId: string }) => createMergedTransaction(targetId, sourceId),
    onSettled: refreshAll,
  });

  return { decide, split, merge };
}
