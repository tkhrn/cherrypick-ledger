import { describe, expect, it } from 'vitest';
import { parseNotification } from '../../src/parse/parseNotification.ts';

const at = '2026-10-07T08:53:00Z';

// 실제 알림 원문 (사용자 기기)
describe('app rules for Hana Card and Toss', () => {
  it.each([
    ['com.hanaskcard.paycla', '(결제) 9,000원', '종로수제비 / 신용(일시불,5*7*) / 10.07 19:41 / 누적이용금액 603,727원', 9000, '종로수제비'],
    ['viva.republica.toss', '9,000원 결제', '토스뱅크 하나카드 Wide | 종로수제비', 9000, '종로수제비'],
    ['viva.republica.toss', '10,000원 결제', '토스뱅크 체크카드 | 태성', 10000, '태성'],
    ['viva.republica.toss', '7,200원 결제', '토스뱅크 하나카드 Wide | 브루다커피 그랑서울점', 7200, '브루다커피 그랑서울점'],
    ['sms', '', '[Web발신]\n하나5*7*승인 이*춘 204,500원 일시불 10/07 17:53 종로기대찬의원누적594,727원', 204500, '종로기대찬의원'],
  ])('%s: %s → %s', (sourcePackage, title, body, amount, merchant) => {
    const result = parseNotification({ id: 'r', sourcePackage, title, body, postedAt: at });
    expect(result.event).toMatchObject({ kind: 'payment', amount, merchant });
    expect(result.needsAi).toBe(false);
  });
});

describe('bank withdrawal SMS', () => {
  it('reads the recipient between the amount and the balance', () => {
    const body = '출금 100,000원 토뱅　이장춘　 잔액 200,000원\n10/03 17:45 117-******-34007(구)620****';
    const result = parseNotification({ id: 'r', sourcePackage: 'sms', title: '', body, postedAt: at });
    expect(result.event).toMatchObject({ kind: 'transfer_out', amount: 100000, merchant: '토뱅 이장춘' });
    expect(result.needsAi).toBe(false);
  });
});
