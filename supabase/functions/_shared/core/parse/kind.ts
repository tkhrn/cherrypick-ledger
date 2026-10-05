import type { EventKind } from '../types.ts';

const KIND_KEYWORDS: [Exclude<EventKind, 'unknown'>, RegExp][] = [
  ['cancel', /취소/],
  ['deposit', /입금|받았어요|들어왔어요/],
  ['transfer_out', /출금|이체|송금|보냈어요/],
  ['payment', /승인|결제|사용/],
];

export function detectKind(text: string): EventKind | null {
  for (const [kind, pattern] of KIND_KEYWORDS) {
    if (pattern.test(text)) return kind;
  }
  return null;
}
