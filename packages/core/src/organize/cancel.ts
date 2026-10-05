import type { ParsedEvent } from '../parse/parseNotification.ts';
import { GROUP_WINDOW_MS, type TxSnapshot } from './group.ts';

export const CANCEL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 승인취소가 가리키는 원래 결제. 아직 취소되지 않은 결제를 먼저 찾고,
 * 없으면 방금(10분 안) 다른 앱 알림으로 취소 처리된 같은 결제를 돌려준다 (같은 취소의 두 번째 알림).
 */
export function matchCancel(e: ParsedEvent, txs: TxSnapshot[]): TxSnapshot | null {
  return matchOpenPayment(e, txs) ?? matchRecentlyCancelled(e, txs);
}

function matchRecentlyCancelled(e: ParsedEvent, txs: TxSnapshot[]): TxSnapshot | null {
  const at = Date.parse(e.occurredAt);
  return (
    txs.find(
      (t) => t.kind === 'payment' && t.amount === e.amount && t.cancelledAt !== null && Math.abs(Date.parse(t.cancelledAt) - at) <= GROUP_WINDOW_MS,
    ) ?? null
  );
}

function matchOpenPayment(e: ParsedEvent, txs: TxSnapshot[]): TxSnapshot | null {
  const at = Date.parse(e.occurredAt);
  const candidates = txs.filter((t) => {
    const age = at - Date.parse(t.occurredAt);
    return t.kind === 'payment' && t.amount === e.amount && t.cancelledAt === null && age >= 0 && age <= CANCEL_WINDOW_MS;
  });
  const byNewest = [...candidates].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const sameMerchant = e.merchant ? byNewest.find((t) => t.merchant === e.merchant) : undefined;
  return sameMerchant ?? byNewest[0] ?? null;
}
