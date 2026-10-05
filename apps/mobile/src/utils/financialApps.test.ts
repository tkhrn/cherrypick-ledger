import { isLikelyFinancialApp, sortForSelection } from './financialApps';

describe('isLikelyFinancialApp', () => {
  it.each([
    [{ packageName: 'viva.republica.toss', label: '토스' }, true],
    [{ packageName: 'com.kakaobank.channel', label: '카카오뱅크' }, true],
    [{ packageName: 'com.shcard.smartpay', label: '신한 SOL페이' }, true],
    [{ packageName: 'com.example.wallet', label: '우리은행' }, true],
    [{ packageName: 'com.nhn.android.search', label: '네이버' }, false],
    [{ packageName: 'com.kakao.talk', label: '카카오톡' }, false],
  ])('%j → %s', (app, expected) => {
    expect(isLikelyFinancialApp(app)).toBe(expected);
  });
});

describe('sortForSelection', () => {
  it('puts likely financial apps first, then sorts by label', () => {
    const sorted = sortForSelection([
      { packageName: 'com.nhn.android.search', label: '네이버' },
      { packageName: 'viva.republica.toss', label: '토스' },
      { packageName: 'com.kakaobank.channel', label: '카카오뱅크' },
    ]);
    expect(sorted.map((a) => a.label)).toEqual(['카카오뱅크', '토스', '네이버']);
  });
});
