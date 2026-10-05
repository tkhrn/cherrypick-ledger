import { canSave, initialDraft } from './draft';

const tx = {
  status: 'pending' as const,
  category: { id: 'c-food', name: '식비', icon: 'dots', colorToken: 'cat-coral' as const },
  groupId: null,
  memo: null,
  merchant: null,
};

describe('transaction sheet draft', () => {
  it('starts from the transaction, with the suggested category', () => {
    expect(initialDraft(tx)).toEqual({ status: 'pending', categoryId: 'c-food', groupId: null, memo: '', merchant: '' });
  });

  it('cannot save before anything changes', () => {
    expect(canSave(initialDraft(tx), initialDraft(tx))).toBe(false);
  });

  it('can save my spending once a category is chosen', () => {
    const start = initialDraft(tx);
    expect(canSave({ ...start, status: 'mine' }, start)).toBe(true);
    expect(canSave({ ...start, status: 'mine', categoryId: null }, start)).toBe(false);
  });

  it('needs a group for the group ledger', () => {
    const start = initialDraft(tx);
    expect(canSave({ ...start, status: 'group' }, start)).toBe(false);
    expect(canSave({ ...start, status: 'group', groupId: 'g1' }, start)).toBe(true);
  });

  it('can save only a merchant name fix', () => {
    const start = initialDraft(tx);
    expect(canSave({ ...start, merchant: '한솥도시락' }, start)).toBe(true);
    expect(canSave({ ...start, merchant: '   ' }, start)).toBe(false);
  });
});
