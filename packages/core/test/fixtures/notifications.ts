import type { ParseResult, RawNotification } from '../../src/parse/parseNotification.ts';

// 실제 알림 문구가 모이면 이 파일을 교체·보강한다 (운영 1주차).
export interface NotificationFixture {
  name: string;
  input: RawNotification;
  expected: Omit<ParseResult['event'], 'rawId' | 'sourcePackage'> & { isFinancial: boolean; needsAi: boolean };
}

const postedAt = '2026-10-05T10:45:00Z';
const raw = (id: string, sourcePackage: string, title: string, body: string): RawNotification => ({ id, sourcePackage, title, body, postedAt });

export const NOTIFICATION_FIXTURES: NotificationFixture[] = [
  {
    name: '신한카드 승인 문자',
    input: raw('r1', 'sms', '', '[Web발신]\n신한카드(1234)승인\n홍*동\n12,000원(일시불)\n10/05 19:42\n스타벅스 강남점\n누적1,230,000원'),
    expected: { kind: 'payment', amount: 12000, merchant: '스타벅스 강남점', accountLast4: '1234', occurredAt: '2026-10-05T19:42:00+09:00', parser: 'rule:card-sms', isFinancial: true, needsAi: false },
  },
  {
    name: '토스 결제 푸시',
    input: raw('r2', 'viva.republica.toss', '결제 완료', '고기굽는집에서 20,000원 결제했어요'),
    expected: { kind: 'payment', amount: 20000, merchant: '고기굽는집', accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: false },
  },
  {
    name: '카드앱 승인 푸시 (가게명 없음)',
    input: raw('r3', 'com.kbcard.cxh.appcard', 'KB국민카드', '승인 7,800원 일시불'),
    expected: { kind: 'payment', amount: 7800, merchant: null, accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: true },
  },
  {
    name: '토스 송금 푸시',
    input: raw('r4', 'viva.republica.toss', '송금 완료', '김철수님에게 30,000원 보냈어요'),
    expected: { kind: 'transfer_out', amount: 30000, merchant: '김철수', accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: false },
  },
  {
    name: '은행 출금 문자',
    input: raw('r5', 'sms', '', '[Web발신]\n신한 10/05 19:30\n110-***-123456\n출금 30,000원\n잔액 120,500원\n김철수'),
    expected: { kind: 'transfer_out', amount: 30000, merchant: '김철수', accountLast4: '3456', occurredAt: '2026-10-05T19:30:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: false },
  },
  {
    name: '카드 승인취소 문자',
    input: raw('r6', 'sms', '', '[Web발신]\n신한카드(1234)승인취소\n홍*동\n12,000원\n10/05 20:10\n스타벅스 강남점'),
    expected: { kind: 'cancel', amount: 12000, merchant: '스타벅스 강남점', accountLast4: '1234', occurredAt: '2026-10-05T20:10:00+09:00', parser: 'rule:card-sms', isFinancial: true, needsAi: false },
  },
  {
    name: '입금 푸시',
    input: raw('r7', 'com.kakaobank.channel', '입금', '김철수님이 50,000원을 보내 입금됐어요'),
    expected: { kind: 'deposit', amount: 50000, merchant: null, accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: false },
  },
  {
    name: '광고 푸시',
    input: raw('r8', 'viva.republica.toss', '이번 주 혜택', '지금 확인하고 포인트 받아가세요'),
    expected: { kind: 'unknown', amount: null, merchant: null, accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: false, needsAi: false },
  },
  {
    name: '금액만 있고 종류 키워드 없음',
    input: raw('r9', 'com.kakaopay.app', '카카오페이', '스타벅스 5,600원'),
    expected: { kind: 'unknown', amount: 5600, merchant: null, accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: true },
  },
  {
    name: '카카오페이 결제 푸시',
    input: raw('r10', 'com.kakaopay.app', '결제 완료', '[카카오페이] 한솥도시락에서 7,800원 결제'),
    expected: { kind: 'payment', amount: 7800, merchant: '한솥도시락', accountLast4: null, occurredAt: '2026-10-05T19:45:00+09:00', parser: 'rule:generic', isFinancial: true, needsAi: false },
  },
];
