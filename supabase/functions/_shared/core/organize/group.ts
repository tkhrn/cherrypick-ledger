import type { ParsedEvent } from '../parse/parseNotification.ts';
import type { EventKind } from '../types.ts';

export type TxStatus = 'pending' | 'mine' | 'group' | 'ignored' | 'auto_hidden';

export interface TxSnapshot {
  id: string;
  kind: EventKind;
  amount: number | null;
  merchant: string | null;
  occurredAt: string;
  status: TxStatus;
  sourcePackages: string[];
  cancelledAt: string | null;
  categoryId: string | null;
  reviewReason: ReviewReason | null;
}

export type ReviewReason = 'ambiguous_group' | 'missing_merchant' | 'unmatched_cancel' | 'parse_failed';

export type GroupDecision = { type: 'attach'; txId: string; ambiguous: boolean } | { type: 'create' };

export const GROUP_WINDOW_MS = 10 * 60 * 1000;

export function findGroup(e: ParsedEvent, txs: TxSnapshot[]): GroupDecision {
  if (e.amount === null) return { type: 'create' };
  const at = Date.parse(e.occurredAt);
  const candidates = txs
    .filter((t) => t.kind === e.kind && t.amount === e.amount && !t.sourcePackages.includes(e.sourcePackage))
    .map((t) => ({ t, distance: Math.abs(Date.parse(t.occurredAt) - at) }))
    .filter(({ distance }) => distance <= GROUP_WINDOW_MS)
    .sort((a, b) => a.distance - b.distance);

  const closest = candidates[0];
  if (!closest) return { type: 'create' };
  return { type: 'attach', txId: closest.t.id, ambiguous: candidates.length > 1 };
}
