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
