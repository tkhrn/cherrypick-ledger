import type { AiParseItem } from './types.ts';

export const AI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          kind: { type: 'STRING', enum: ['payment', 'transfer_out', 'cancel', 'deposit', 'unknown'] },
          merchant: { type: 'STRING', nullable: true },
          accountLast4: { type: 'STRING', nullable: true },
          category: { type: 'STRING', nullable: true },
        },
        required: ['id'],
      },
    },
  },
  required: ['items'],
} as const;

export function buildPrompt(items: AiParseItem[], categoryNames: string[]): string {
  const tasks = (item: AiParseItem) => [item.needsParse && 'parse', item.needsCategory && 'category'].filter(Boolean).join(', ');
  const body = items.map((item) => `---\nid: ${item.id}\ntasks: ${tasks(item)}\n${item.text}`).join('\n');
  return [
    '한국 금융앱 알림 문구를 분석해 JSON으로만 답한다.',
    'tasks에 parse가 있으면: kind(payment=카드·간편결제 승인, transfer_out=출금·이체·송금, cancel=승인취소, deposit=입금, unknown=판단 불가), merchant(결제한 가게 또는 돈을 받은 사람 이름, 없으면 null), accountLast4(상대 계좌 끝 4자리, 없으면 null)를 채운다.',
    `tasks에 category가 있으면: category를 다음 목록 중 하나로만 고르고, 애매하면 null: ${categoryNames.join(', ')}`,
    '알림에 없는 정보를 지어내지 않는다. 각 항목의 id를 그대로 돌려준다.',
    body,
  ].join('\n');
}
