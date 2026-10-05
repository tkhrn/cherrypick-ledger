import { merchantKey } from '@cherrypick/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMergedTransaction } from '@/apis/merge_transactions';
import { createSplitTransaction } from '@/apis/split_transaction';
import { updateTransactionDecision } from '@/apis/decide_transaction';
import type { CategoryDTO } from '@/apis/categories';
import { updateTransactionMerchant, type TransactionDTO } from '@/apis/transactions';
import type { DecisionStatus, Transaction } from '@/types/transaction';

export interface Decision {
  transaction: Pick<Transaction, 'id' | 'merchant' | 'category' | 'groupId' | 'memo'>;
  status: DecisionStatus;
  categoryId?: string | null;
  groupId?: string | null;
  memo?: string | null;
}

type Snapshot = [readonly unknown[], TransactionDTO[] | undefined][];

/** 결정 저장 요청. 카테고리를 안 고르면 기존 값을 유지하고, 모임은 모임장부로 보낼 때만 남긴다 */
const toDecisionPayload = ({ transaction, status, categoryId, groupId, memo }: Decision, merchant: string | null) => ({
  id: transaction.id,
  status,
  categoryId: categoryId ?? transaction.category?.id ?? null,
  groupId: status === 'group' ? (groupId ?? transaction.groupId) : null,
  memo: memo ?? null,
  merchantKey: merchant ? merchantKey(merchant) : null,
});

/** 결제 건 결정(내 소비·모임장부·무시·되돌리기)과 묶음 조정(나누기·합치기) */
export function useTransactionDecision() {
  const queryClient = useQueryClient();
  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ['transactions'] });

  const decide = useMutation({
    mutationFn: (decision: Decision) => updateTransactionDecision(toDecisionPayload(decision, decision.transaction.merchant)),
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

  // 상세 시트의 저장: 가게 이름을 고쳤으면 먼저 반영하고, 결정·카테고리·모임·메모를 저장한다
  const save = useMutation({
    mutationFn: async ({ merchant, ...decision }: Decision & { merchant: string }) => {
      const { transaction } = decision;
      const nextMerchant = merchant.trim() || transaction.merchant;
      if (nextMerchant && nextMerchant !== transaction.merchant) await updateTransactionMerchant(transaction.id, nextMerchant);
      await updateTransactionDecision(toDecisionPayload(decision, nextMerchant));
    },
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

  return { decide, save, split, merge };
}
