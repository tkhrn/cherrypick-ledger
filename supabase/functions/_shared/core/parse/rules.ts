import type { AppRule } from './parseNotification.ts';
import { lastMeaningfulLine } from './merchant.ts';

const CARD_SMS_HEADER = /카드\(\d{4}\)\s*승인/;

const cardSmsRule: AppRule = {
  id: 'card-sms',
  packages: ['sms'],
  parse: (n) => {
    if (!CARD_SMS_HEADER.test(n.body)) return null;
    const merchant = lastMeaningfulLine(n.body);
    return merchant ? { merchant } : null;
  },
};

// 하나카드 앱: "종로수제비 / 신용(일시불,5*7*) / 10.07 19:41 / 누적이용금액 603,727원"
const HANA_APP_MERCHANT = /^(.+?)\s*\/\s*(?:신용|체크)/;

const hanaCardAppRule: AppRule = {
  id: 'hana-card-app',
  packages: ['com.hanaskcard.paycla'],
  parse: (n) => {
    const merchant = n.body.match(HANA_APP_MERCHANT)?.[1]?.trim();
    return merchant ? { merchant } : null;
  },
};

// 하나카드 문자: "하나5*7*승인 이*춘 204,500원 일시불 10/07 17:53 종로기대찬의원누적594,727원"
const HANA_SMS_HEADER = /하나\S*승인/;
const HANA_SMS_MERCHANT = /\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}\s+(.+?)(?:누적|$)/m;

const hanaCardSmsRule: AppRule = {
  id: 'hana-card-sms',
  packages: ['sms'],
  parse: (n) => {
    if (!HANA_SMS_HEADER.test(n.body)) return null;
    const merchant = n.body.match(HANA_SMS_MERCHANT)?.[1]?.trim();
    return merchant ? { merchant } : null;
  },
};

// 토스 카드 결제: 제목 "9,000원 결제", 본문 "토스뱅크 하나카드 Wide | 종로수제비"
const TOSS_CARD_MERCHANT = /^[^|\n]*카드[^|\n]*\|\s*(.+)$/m;

const tossCardRule: AppRule = {
  id: 'toss-card',
  packages: ['viva.republica.toss'],
  parse: (n) => {
    const merchant = n.body.match(TOSS_CARD_MERCHANT)?.[1]?.trim();
    return merchant ? { merchant } : null;
  },
};

export const APP_RULES: AppRule[] = [cardSmsRule, hanaCardSmsRule, hanaCardAppRule, tossCardRule];
