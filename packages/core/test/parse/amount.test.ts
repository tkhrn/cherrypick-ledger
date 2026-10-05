import { describe, expect, it } from 'vitest';
import { extractAmount } from '../../src/parse/amount.ts';

describe('extractAmount', () => {
  it.each([
    ['12,000원 승인', 12000],
    ['12000원', 12000],
    ['1,234,567원', 1234567],
    ['12,000 원', 12000],
    ['KRW 12,000', 12000],
    ['승인 5,600원 누적 1,230,000원', 5600],
    ['출금 30,000원 잔액 120,500원', 30000],
    ['누적 1,230,000원 승인 5,600원', 5600],
    ['사용가능한도 500,000원 남음 결제 9,900원', 9900],
  ])('%s → %d', (text, expected) => {
    expect(extractAmount(text)).toBe(expected);
  });

  it('returns null when there is no amount', () => {
    expect(extractAmount('이벤트 참여하세요')).toBeNull();
  });
});
