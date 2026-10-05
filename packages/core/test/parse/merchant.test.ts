import { describe, expect, it } from 'vitest';
import { guessMerchant } from '../../src/parse/merchant.ts';

describe('guessMerchant', () => {
  it('reads the last line of a card SMS', () => {
    const sms = '[Web발신]\n신한카드(1234)승인\n홍*동\n12,000원(일시불)\n10/05 19:42\n스타벅스 강남점\n누적1,230,000원';
    expect(guessMerchant(sms, 'payment')).toBe('스타벅스 강남점');
  });

  it('reads "OOO에서 N원 결제"', () => {
    expect(guessMerchant('고기굽는집에서 20,000원 결제했어요', 'payment')).toBe('고기굽는집');
  });

  it('takes only the merchant words right before 에서 in a one-line SMS', () => {
    expect(guessMerchant('[Web발신] 신한카드(1234)승인 홍*동 12,000원 일시불 스타벅스강남에서 12,000원 결제', 'payment')).toBe('스타벅스강남');
    expect(guessMerchant('버거킹 강남역점에서 8,000원 결제', 'payment')).toBe('버거킹 강남역점');
  });

  it('reads "N원 OOO 승인"', () => {
    expect(guessMerchant('12,000원 한솥도시락 승인', 'payment')).toBe('한솥도시락');
  });

  it('reads a transfer recipient with 님에게', () => {
    expect(guessMerchant('김철수님에게 30,000원 보냈어요', 'transfer_out')).toBe('김철수');
  });

  it('reads a transfer recipient after 받는분', () => {
    expect(guessMerchant('이체 30,000원 받는분 김철수', 'transfer_out')).toBe('김철수');
  });

  it('returns null when nothing looks like a merchant', () => {
    expect(guessMerchant('승인 12,000원', 'payment')).toBeNull();
  });
});
