import { describe, expect, it } from 'vitest';
import { extractAccountLast4 } from '../../src/parse/account.ts';

// 결과는 "돈을 받는 쪽" 계좌 끝 4자리다. 출금 문자에 찍힌 내 계좌(보내는 쪽)는 상대 계좌가 아니다.
describe('extractAccountLast4 (counterparty account)', () => {
  it.each([
    ['출금 30,000원 입금계좌 국민 123-***-3456', '3456'],
    ['받는분 김철수 우리 1002-***-9999', '9999'],
    ['받는 계좌 ****5678 이체', '5678'],
    ['신한 → 국민 123-456-7890 30,000원 이체', '7890'],
  ])('%s → %s', (text, expected) => {
    expect(extractAccountLast4(text)).toBe(expected);
  });

  it('ignores the sender account printed on a withdrawal SMS', () => {
    expect(extractAccountLast4('신한 110-***-123456 출금 30,000원 김철수')).toBeNull();
  });

  it('ignores card numbers', () => {
    expect(extractAccountLast4('신한카드(1234)승인 홍*동 12,000원')).toBeNull();
  });

  it('returns null when no account is present', () => {
    expect(extractAccountLast4('스타벅스에서 5,600원 결제')).toBeNull();
  });
});
