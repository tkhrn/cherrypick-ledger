import { describe, expect, it } from 'vitest';
import { merchantKey } from '../src/merchantKey.ts';

describe('merchantKey', () => {
  it.each([
    ['스타벅스코리아 강남점', '스타벅스'],
    ['스타벅스 역삼점', '스타벅스'],
    ['(주)우아한형제들', '우아한형제들'],
    ['주식회사 쿠팡', '쿠팡'],
    ['GS25 역삼 2호점', 'gs25'],
    ['  CU  ', 'cu'],
  ])('%s → %s', (name, key) => {
    expect(merchantKey(name)).toBe(key);
  });
});
