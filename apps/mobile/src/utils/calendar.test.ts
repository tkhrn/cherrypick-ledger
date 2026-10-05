import { buildMonthGrid, categoryShares, inShare, sumByDay } from './calendar';

describe('buildMonthGrid', () => {
  it('pads the first week so the 1st lands on its weekday', () => {
    const grid = buildMonthGrid(2026, 10);
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, '2026-10-01']);
    expect(grid.filter(Boolean)).toHaveLength(31);
    expect(grid.length % 7).toBe(0);
  });
});

describe('sumByDay', () => {
  it('sums amounts per KST day and skips cancelled items', () => {
    const sums = sumByDay([
      { occurredAt: '2026-10-05T10:00:00Z', amount: 5600, cancelledAt: null },
      { occurredAt: '2026-10-05T11:00:00Z', amount: 1000, cancelledAt: '2026-10-05T12:00:00Z' },
      { occurredAt: '2026-10-04T16:00:00Z', amount: 2000, cancelledAt: null },
      { occurredAt: '2026-10-03T01:00:00Z', amount: null, cancelledAt: null },
    ]);
    expect(sums).toEqual(new Map([['2026-10-05', 7600]]));
  });
});

describe('categoryShares', () => {
  const cat = (id: string, colorToken = 'cat-coral') => ({ id, name: id, icon: 'dots', colorToken: colorToken as 'cat-coral' });
  it('orders categories by amount and folds slices under 3% into 기타', () => {
    const shares = categoryShares([
      { amount: 6000, cancelledAt: null, category: cat('식비') },
      { amount: 3800, cancelledAt: null, category: cat('교통', 'cat-teal') },
      { amount: 100, cancelledAt: null, category: cat('선물', 'cat-green') },
      { amount: 100, cancelledAt: null, category: null },
      { amount: 9999, cancelledAt: '2026-10-05T00:00:00Z', category: cat('쇼핑') },
    ]);
    expect(shares.map((s) => [s.name, s.amount, Math.round(s.ratio * 100)])).toEqual([
      ['식비', 6000, 60],
      ['교통', 3800, 38],
      ['기타', 200, 2],
    ]);
  });

  it('returns nothing for an empty month', () => {
    expect(categoryShares([])).toEqual([]);
  });
});

describe('inShare', () => {
  const cat = (id: string) => ({ id, name: id, icon: 'dots', colorToken: 'cat-coral' as const });
  const items = [
    { id: 'a', amount: 9000, cancelledAt: null, category: cat('식비') },
    { id: 'b', amount: 100, cancelledAt: null, category: cat('선물') },
    { id: 'c', amount: 100, cancelledAt: null, category: null },
  ];
  it('keeps items of a major category', () => {
    expect(inShare(items, categoryShares(items), '식비').map((i) => i.id)).toEqual(['a']);
  });
  it('keeps small and uncategorized items for 기타', () => {
    const other = categoryShares(items).at(-1)!.key;
    expect(inShare(items, categoryShares(items), other).map((i) => i.id)).toEqual(['b', 'c']);
  });
});
