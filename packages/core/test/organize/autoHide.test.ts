import { describe, expect, it } from 'vitest';
import { autoHideReason } from '../../src/organize/autoHide.ts';

describe('autoHideReason', () => {
  it('hides transfers to my own account', () => {
    expect(autoHideReason('transfer_out', '3456', ['3456', '1111'])).toBe('own_transfer');
  });

  it('keeps transfers to other or unknown accounts', () => {
    expect(autoHideReason('transfer_out', '9999', ['3456'])).toBeNull();
    expect(autoHideReason('transfer_out', null, ['3456'])).toBeNull();
  });

  it('hides deposits', () => {
    expect(autoHideReason('deposit', null, [])).toBe('deposit');
  });

  it('keeps payments even when the card number matches an account', () => {
    expect(autoHideReason('payment', '3456', ['3456'])).toBeNull();
  });
});
