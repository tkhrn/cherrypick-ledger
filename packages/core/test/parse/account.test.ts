import { describe, expect, it } from 'vitest';
import { extractAccountLast4 } from '../../src/parse/account.ts';

describe('extractAccountLast4', () => {
  it.each([
    ['신한 110-***-123456 출금 30,000원', '3456'],
    ['국민(1234) 입금 50,000원', '1234'],
    ['계좌 ****5678로 이체', '5678'],
    ['신한카드(1234)승인 홍*동 12,000원', '1234'],
  ])('%s → %s', (text, expected) => {
    expect(extractAccountLast4(text)).toBe(expected);
  });

  it('returns null when no account is present', () => {
    expect(extractAccountLast4('스타벅스에서 5,600원 결제')).toBeNull();
  });
});
