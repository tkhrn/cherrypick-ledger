import { describe, expect, it } from 'vitest';
import { validateAiOutputs } from '../../src/ai/validate.ts';

const ids = ['a', 'b'];
const categories = ['식비', '카페·간식'];

describe('validateAiOutputs', () => {
  it('keeps valid items', () => {
    const raw = { items: [{ id: 'a', kind: 'payment', merchant: '스타벅스', accountLast4: null, category: '카페·간식' }] };
    expect(validateAiOutputs(raw, ids, categories)).toEqual([
      { id: 'a', kind: 'payment', merchant: '스타벅스', accountLast4: null, category: '카페·간식' },
    ]);
  });

  it('drops items with unknown ids', () => {
    expect(validateAiOutputs({ items: [{ id: 'zzz', merchant: 'x' }] }, ids, categories)).toEqual([]);
  });

  it('drops an invalid kind but keeps the other fields', () => {
    const [item] = validateAiOutputs({ items: [{ id: 'a', kind: 'paymnet', merchant: '가게' }] }, ids, categories);
    expect(item).toEqual({ id: 'a', merchant: '가게' });
  });

  it('nulls a category outside the list', () => {
    const [item] = validateAiOutputs({ items: [{ id: 'a', category: '술집' }] }, ids, categories);
    expect(item?.category).toBeNull();
  });

  it('returns an empty list for malformed payloads', () => {
    expect(validateAiOutputs('nope', ids, categories)).toEqual([]);
    expect(validateAiOutputs({ items: 'nope' }, ids, categories)).toEqual([]);
    expect(validateAiOutputs(null, ids, categories)).toEqual([]);
  });

  it('truncates long merchants and rejects bad account digits', () => {
    const [item] = validateAiOutputs({ items: [{ id: 'b', merchant: 'x'.repeat(80), accountLast4: '12ab' }] }, ids, categories);
    expect(item?.merchant).toHaveLength(40);
    expect(item?.accountLast4).toBeNull();
  });
});
