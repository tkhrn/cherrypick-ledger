import { describe, expect, it } from 'vitest';
import { matchCancel } from '../../src/organize/cancel.ts';
import { event, kst, tx } from './helpers.ts';

const cancel = (overrides = {}) => event({ kind: 'cancel', amount: 12000, occurredAt: kst('20:10'), ...overrides });

describe('matchCancel', () => {
  it('matches a payment of the same amount within 7 days', () => {
    const target = tx({ id: 't1', amount: 12000, occurredAt: kst('19:42') });
    expect(matchCancel(cancel(), [target])?.id).toBe('t1');
  });

  it('prefers the same merchant over a newer payment', () => {
    const same = tx({ id: 'same', amount: 12000, merchant: '스타벅스 강남점', occurredAt: kst('10:00') });
    const newer = tx({ id: 'newer', amount: 12000, merchant: '다른가게', occurredAt: kst('19:00') });
    expect(matchCancel(cancel({ merchant: '스타벅스 강남점' }), [same, newer])?.id).toBe('same');
  });

  it('prefers the newest payment when merchants do not help', () => {
    const older = tx({ id: 'older', amount: 12000, occurredAt: kst('10:00') });
    const newer = tx({ id: 'newer', amount: 12000, occurredAt: kst('19:00') });
    expect(matchCancel(cancel(), [older, newer])?.id).toBe('newer');
  });

  it('ignores payments older than 7 days', () => {
    expect(matchCancel(cancel(), [tx({ amount: 12000, occurredAt: '2026-09-27T19:00:00+09:00' })])).toBeNull();
  });

  it('ignores payments already cancelled', () => {
    expect(matchCancel(cancel(), [tx({ amount: 12000, cancelledAt: kst('19:50') })])).toBeNull();
  });

  it('ignores non-payment transactions', () => {
    expect(matchCancel(cancel(), [tx({ amount: 12000, kind: 'transfer_out' })])).toBeNull();
  });

  it('ignores payments after the cancellation', () => {
    expect(matchCancel(cancel(), [tx({ amount: 12000, occurredAt: kst('21:00') })])).toBeNull();
  });
});
