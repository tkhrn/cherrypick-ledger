import type { EventKind } from '../types.ts';
import { extractAccountLast4 } from './account.ts';
import { extractAmount } from './amount.ts';
import { detectKind } from './kind.ts';
import { guessMerchant } from './merchant.ts';
import { extractOccurredAt } from './occurredAt.ts';
import { APP_RULES } from './rules.ts';

export interface RawNotification {
  id: string;
  sourcePackage: string;
  title: string;
  body: string;
  postedAt: string;
}

export interface ParsedEvent {
  rawId: string;
  sourcePackage: string;
  kind: EventKind;
  amount: number | null;
  merchant: string | null;
  accountLast4: string | null;
  occurredAt: string;
  parser: string;
}

export interface ParseResult {
  event: ParsedEvent;
  isFinancial: boolean;
  needsAi: boolean;
}

type RuleFields = Partial<Pick<ParsedEvent, 'kind' | 'amount' | 'merchant' | 'accountLast4' | 'occurredAt'>>;

export interface AppRule {
  id: string;
  packages: string[];
  parse(n: RawNotification): RuleFields | null;
}

// 카드 혜택 안내(할인 예정·청구할인). 금액이 있어도 결제가 아니다. "즉시할인"처럼 결제 문자 안의 할인 줄은 해당하지 않는다
const BENEFIT_NOTICE = /할인되어|청구할인|할인받아요|할인\s*\(?예정/;

const KINDS_WITH_MERCHANT: EventKind[] = ['payment', 'transfer_out', 'cancel'];
const KINDS_NEEDING_MERCHANT: EventKind[] = ['payment', 'transfer_out'];

function applyAppRule(n: RawNotification, rules: AppRule[]): { id: string; fields: RuleFields } | null {
  for (const rule of rules) {
    if (!rule.packages.includes(n.sourcePackage)) continue;
    const fields = rule.parse(n);
    if (fields) return { id: rule.id, fields };
  }
  return null;
}

export function parseNotification(n: RawNotification, rules: AppRule[] = APP_RULES): ParseResult {
  const text = n.title ? `${n.title}\n${n.body}` : n.body;
  const amount = extractAmount(text);
  const occurredAt = extractOccurredAt(text, n.postedAt);
  const base = { rawId: n.id, sourcePackage: n.sourcePackage, accountLast4: extractAccountLast4(text), occurredAt };

  if (amount === null || BENEFIT_NOTICE.test(text)) {
    return {
      event: { ...base, kind: 'unknown', amount: null, merchant: null, parser: 'rule:generic' },
      isFinancial: false,
      needsAi: false,
    };
  }

  const kind = detectKind(text) ?? 'unknown';
  const generic: ParsedEvent = {
    ...base,
    kind,
    amount,
    merchant: KINDS_WITH_MERCHANT.includes(kind) ? guessMerchant(text, kind) : null,
    parser: 'rule:generic',
  };
  const ruled = applyAppRule(n, rules);
  const event: ParsedEvent = ruled ? { ...generic, ...ruled.fields, parser: `rule:${ruled.id}` } : generic;
  const needsAi = event.kind === 'unknown' || (KINDS_NEEDING_MERCHANT.includes(event.kind) && event.merchant === null);

  return { event, isFinancial: true, needsAi };
}
