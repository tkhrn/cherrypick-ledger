import { describe, expect, it } from 'vitest';
import { extractOccurredAt } from '../../src/parse/occurredAt.ts';

const POSTED_AT = '2026-10-05T10:45:00Z'; // KST 19:45

describe('extractOccurredAt', () => {
  it('uses month/day and time from the body', () => {
    expect(extractOccurredAt('승인 10/05 19:42 스타벅스', POSTED_AT)).toBe('2026-10-05T19:42:00+09:00');
  });

  it('uses time only, on the posted day', () => {
    expect(extractOccurredAt('19:42 승인', POSTED_AT)).toBe('2026-10-05T19:42:00+09:00');
  });

  it('moves a time far in the future to the previous day', () => {
    expect(extractOccurredAt('23:50 승인', '2026-10-05T15:05:00Z')).toBe('2026-10-05T23:50:00+09:00');
    expect(extractOccurredAt('23:50 승인', '2026-10-04T15:20:00Z')).toBe('2026-10-04T23:50:00+09:00');
  });

  it('falls back to the posted time in KST', () => {
    expect(extractOccurredAt('스타벅스 결제', POSTED_AT)).toBe('2026-10-05T19:45:00+09:00');
  });
});
