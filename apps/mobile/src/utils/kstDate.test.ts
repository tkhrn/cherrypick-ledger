import { dayLabel, kstDayKey, kstMonthRange, kstTime, nextOrganizeRunLabel } from './kstDate';

describe('kstDayKey', () => {
  it('converts an instant to the KST calendar day', () => {
    expect(kstDayKey('2026-10-05T16:00:00Z')).toBe('2026-10-06');
    expect(kstDayKey('2026-10-05T14:59:00Z')).toBe('2026-10-05');
  });
});

describe('kstTime', () => {
  it('formats the KST wall-clock time', () => {
    expect(kstTime('2026-10-05T10:42:00Z')).toBe('19:42');
  });
});

describe('dayLabel', () => {
  it('names today and yesterday', () => {
    expect(dayLabel('2026-10-05', '2026-10-05')).toBe('오늘');
    expect(dayLabel('2026-10-04', '2026-10-05')).toBe('어제');
  });

  it('formats older days with the weekday', () => {
    expect(dayLabel('2026-10-02', '2026-10-05')).toBe('10월 2일 (금)');
  });
});

describe('kstMonthRange', () => {
  it('returns UTC instants bounding a KST month', () => {
    expect(kstMonthRange(2026, 10)).toEqual({ from: '2026-09-30T15:00:00.000Z', to: '2026-10-31T15:00:00.000Z' });
  });
});

describe('nextOrganizeRunLabel', () => {
  it('returns the next 3-hour slot in KST', () => {
    expect(nextOrganizeRunLabel(new Date('2026-10-05T04:10:00Z'))).toBe('15:00'); // KST 13:10
    expect(nextOrganizeRunLabel(new Date('2026-10-05T06:00:00Z'))).toBe('18:00'); // KST 15:00 exactly
    expect(nextOrganizeRunLabel(new Date('2026-10-05T13:30:00Z'))).toBe('00:00'); // KST 22:30
  });
});
