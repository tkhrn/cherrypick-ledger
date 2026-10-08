import { describe, expect, it } from 'vitest';
import { parseNotification, type AppRule } from '../../src/parse/parseNotification.ts';
import { NOTIFICATION_FIXTURES } from '../fixtures/notifications.ts';

describe('parseNotification', () => {
  it.each(NOTIFICATION_FIXTURES.map((f) => [f.name, f] as const))('%s', (_, fixture) => {
    const { isFinancial, needsAi, ...event } = fixture.expected;
    const result = parseNotification(fixture.input);
    expect(result.event).toEqual({ ...event, rawId: fixture.input.id, sourcePackage: fixture.input.sourcePackage });
    expect(result.isFinancial).toBe(isFinancial);
    expect(result.needsAi).toBe(needsAi);
  });

  // 카드 혜택 안내: 금액은 있지만 결제가 아니다 (실제 알림 원문)
  it.each([
    ['com.hanaskcard.paycla', '[토스뱅크 하나카드 Wide (블루)] 결제 금액 할인(예', "- '전가맹점 할인_토스뱅크' 혜택으로 90원이 할인되어 결제될 예정이에요.\n◆ 서비스 혜택이 (94,297원) 남았어요."],
    ['viva.republica.toss', '90원 청구할인', '토스뱅크 하나카드 Wide로 결제해서 결제일에 1% 할인받아요.'],
  ])('treats a discount notice from %s as not a payment', (sourcePackage, title, body) => {
    const result = parseNotification({ id: 'r1', sourcePackage, title, body, postedAt: '2026-10-07T03:00:00Z' });
    expect(result.isFinancial).toBe(false);
    expect(result.needsAi).toBe(false);
  });

  it('still reads a payment that mentions an instant discount', () => {
    const result = parseNotification({ id: 'r2', sourcePackage: 'sms', title: '', body: '[Web발신]\n신한카드 승인 즉시할인 1,000원 결제 9,000원 스타벅스', postedAt: '2026-10-07T03:00:00Z' });
    expect(result.isFinancial).toBe(true);
    expect(result.event.amount).toBe(9000);
  });

  it('prefers an app rule over the generic rules', () => {
    const rule: AppRule = { id: 'test-app', packages: ['com.test'], parse: () => ({ merchant: '규칙가게' }) };
    const result = parseNotification(
      { id: 'x', sourcePackage: 'com.test', title: '', body: '12,000원 승인', postedAt: '2026-10-05T10:45:00Z' },
      [rule],
    );
    expect(result.event.merchant).toBe('규칙가게');
    expect(result.event.parser).toBe('rule:test-app');
    expect(result.needsAi).toBe(false);
  });

  it('falls back to generic rules when the app rule returns null', () => {
    const rule: AppRule = { id: 'test-app', packages: ['com.test'], parse: () => null };
    const result = parseNotification(
      { id: 'x', sourcePackage: 'com.test', title: '', body: '한솥도시락에서 7,800원 결제', postedAt: '2026-10-05T10:45:00Z' },
      [rule],
    );
    expect(result.event.parser).toBe('rule:generic');
    expect(result.event.merchant).toBe('한솥도시락');
  });
});
