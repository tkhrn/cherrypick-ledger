import type { DecisionStatus, Transaction } from '@/types/transaction';

/** 상세 시트에서 고르는 중인 값. 저장을 눌러야 서버에 반영된다 */
export interface SheetDraft {
  status: DecisionStatus;
  categoryId: string | null;
  groupId: string | null;
  memo: string;
  merchant: string;
}

export function initialDraft(t: Pick<Transaction, 'status' | 'category' | 'groupId' | 'memo' | 'merchant'>): SheetDraft {
  return {
    status: t.status === 'auto_hidden' ? 'ignored' : t.status,
    categoryId: t.category?.id ?? null,
    groupId: t.status === 'group' ? t.groupId : null,
    memo: t.memo ?? '',
    merchant: t.merchant ?? '',
  };
}

function isComplete(d: SheetDraft): boolean {
  if (d.status === 'mine') return d.categoryId !== null;
  if (d.status === 'group') return d.groupId !== null;
  return true;
}

function isChanged(d: SheetDraft, start: SheetDraft): boolean {
  const merchantChanged = d.merchant.trim() !== start.merchant.trim();
  return d.status !== start.status || d.categoryId !== start.categoryId || d.groupId !== start.groupId || d.memo !== start.memo || merchantChanged;
}

export function canSave(d: SheetDraft, start: SheetDraft): boolean {
  return isComplete(d) && isChanged(d, start);
}
