import type { ParsedEvent } from '../../src/parse/parseNotification.ts';
import type { TxSnapshot } from '../../src/organize/group.ts';

export const kst = (hhmm: string, day = '05') => `2026-10-${day}T${hhmm}:00+09:00`;

export function event(overrides: Partial<ParsedEvent>): ParsedEvent {
  return {
    rawId: 'r', sourcePackage: 'sms', kind: 'payment', amount: 5600, merchant: null,
    accountLast4: null, occurredAt: kst('12:00'), parser: 'rule:generic', ...overrides,
  };
}

export function tx(overrides: Partial<TxSnapshot>): TxSnapshot {
  return {
    id: 't', kind: 'payment', amount: 5600, merchant: null, occurredAt: kst('12:00'),
    status: 'pending', sourcePackages: ['sms'], cancelledAt: null, categoryId: null, reviewReason: null, ...overrides,
  };
}
