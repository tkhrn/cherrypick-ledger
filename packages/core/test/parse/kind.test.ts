import { describe, expect, it } from 'vitest';
import { detectKind } from '../../src/parse/kind.ts';

describe('detectKind', () => {
  it.each([
    ['신한카드 승인취소 12,000원', 'cancel'],
    ['결제 취소 완료', 'cancel'],
    ['국민 입금 50,000원', 'deposit'],
    ['우리 출금 30,000원', 'transfer_out'],
    ['이체 완료', 'transfer_out'],
    ['송금 30,000원', 'transfer_out'],
    ['김철수님에게 30,000원 보냈어요', 'transfer_out'],
    ['신한카드 승인 12,000원', 'payment'],
    ['스타벅스에서 5,600원 결제했어요', 'payment'],
    ['체크카드 사용 7,800원', 'payment'],
  ])('%s → %s', (text, expected) => {
    expect(detectKind(text)).toBe(expected);
  });

  it('returns null for unrelated text', () => {
    expect(detectKind('이번 주 혜택을 확인하세요')).toBeNull();
  });
});
