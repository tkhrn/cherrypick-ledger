import type { ParsedEvent } from '../parse/parseNotification.ts';
import type { TxSnapshot } from './group.ts';

export const CANCEL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function matchCancel(e: ParsedEvent, txs: TxSnapshot[]): TxSnapshot | null {
  const at = Date.parse(e.occurredAt);
  const candidates = txs.filter((t) => {
    const age = at - Date.parse(t.occurredAt);
    return t.kind === 'payment' && t.amount === e.amount && t.cancelledAt === null && age >= 0 && age <= CANCEL_WINDOW_MS;
  });
  const byNewest = [...candidates].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const sameMerchant = e.merchant ? byNewest.find((t) => t.merchant === e.merchant) : undefined;
  return sameMerchant ?? byNewest[0] ?? null;
}
