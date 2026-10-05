import type { EventKind } from '../types.ts';

export type AutoHiddenReason = 'own_transfer' | 'deposit';

export function autoHideReason(kind: EventKind, accountLast4: string | null, myLast4s: string[]): AutoHiddenReason | null {
  if (kind === 'deposit') return 'deposit';
  if (kind === 'transfer_out' && accountLast4 !== null && myLast4s.includes(accountLast4)) return 'own_transfer';
  return null;
}
