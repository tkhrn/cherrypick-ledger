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

export const APP_RULES: AppRule[] = [cardSmsRule];
