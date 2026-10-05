import { groupByDay } from './groupByDay';

const tx = (id: string, occurredAt: string, amount: number | null, cancelledAt: string | null = null) => ({ id, occurredAt, amount, cancelledAt });

describe('groupByDay', () => {
  it('groups by KST day, newest first, with totals that skip cancelled items', () => {
    const days = groupByDay(
      [
        tx('a', '2026-10-05T10:00:00Z', 5600),
        tx('b', '2026-10-05T01:00:00Z', 7800, '2026-10-05T02:00:00Z'),
        tx('c', '2026-10-04T16:30:00Z', 1000),
        tx('d', '2026-10-04T10:00:00Z', null),
      ],
      '2026-10-05',
    );
    expect(days.map((d) => [d.dayKey, d.label, d.total, d.items.map((i) => i.id)])).toEqual([
      ['2026-10-05', '오늘', 6600, ['a', 'b', 'c']],
      ['2026-10-04', '어제', 0, ['d']],
    ]);
  });
});
