import { describe, expect, it } from 'vitest';
import { findGroup } from '../../src/organize/group.ts';
import { event, kst, tx } from './helpers.ts';

describe('findGroup', () => {
  it('creates a new transaction when nothing matches', () => {
    expect(findGroup(event({}), [])).toEqual({ type: 'create' });
  });

  it('attaches notifications of one payment from different apps', () => {
    const existing = [tx({ id: 't1', sourcePackages: ['com.card'], occurredAt: kst('12:00') })];
    expect(findGroup(event({ sourcePackage: 'sms', occurredAt: kst('12:01') }), existing))
      .toEqual({ type: 'attach', txId: 't1', ambiguous: false });
  });

  it('treats two same-amount notifications from the same app as two payments', () => {
    const existing = [tx({ id: 't1', sourcePackages: ['com.card'], occurredAt: kst('12:00') })];
    expect(findGroup(event({ sourcePackage: 'com.card', occurredAt: kst('12:02') }), existing)).toEqual({ type: 'create' });
  });

  it('does not attach beyond 10 minutes', () => {
    const existing = [tx({ id: 't1', sourcePackages: ['com.card'], occurredAt: kst('12:00') })];
    expect(findGroup(event({ occurredAt: kst('12:11') }), existing)).toEqual({ type: 'create' });
  });

  it('attaches at exactly 10 minutes', () => {
    const existing = [tx({ id: 't1', sourcePackages: ['com.card'], occurredAt: kst('12:00') })];
    expect(findGroup(event({ occurredAt: kst('12:10') }), existing).type).toBe('attach');
  });

  it('does not attach across kinds', () => {
    const existing = [tx({ id: 't1', kind: 'payment', sourcePackages: ['com.card'] })];
    expect(findGroup(event({ kind: 'transfer_out' }), existing)).toEqual({ type: 'create' });
  });

  it('does not attach across amounts', () => {
    const existing = [tx({ id: 't1', amount: 5600, sourcePackages: ['com.card'] })];
    expect(findGroup(event({ amount: 5700 }), existing)).toEqual({ type: 'create' });
  });

  it('picks the closest candidate and flags ambiguity when several match', () => {
    const existing = [
      tx({ id: 'far', sourcePackages: ['com.card'], occurredAt: kst('12:00') }),
      tx({ id: 'near', sourcePackages: ['com.card'], occurredAt: kst('12:04') }),
    ];
    expect(findGroup(event({ occurredAt: kst('12:05') }), existing))
      .toEqual({ type: 'attach', txId: 'near', ambiguous: true });
  });

  it('can attach to a transaction the user already decided', () => {
    const existing = [tx({ id: 't1', status: 'mine', sourcePackages: ['com.card'] })];
    expect(findGroup(event({}), existing)).toEqual({ type: 'attach', txId: 't1', ambiguous: false });
  });

  it('never attaches events without an amount', () => {
    const existing = [tx({ id: 't1', amount: null, kind: 'unknown', sourcePackages: ['com.card'] })];
    expect(findGroup(event({ amount: null, kind: 'unknown' }), existing)).toEqual({ type: 'create' });
  });
});
