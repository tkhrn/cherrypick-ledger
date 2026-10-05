import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../../src/ai/prompt.ts';

describe('buildPrompt', () => {
  it('lists the allowed categories and every item with its tasks', () => {
    const prompt = buildPrompt(
      [
        { id: 'a', text: '승인 7,800원', needsParse: true, needsCategory: false },
        { id: 'b', text: '스타벅스 5,600원', needsParse: false, needsCategory: true },
      ],
      ['식비', '카페·간식'],
    );
    expect(prompt).toContain('식비, 카페·간식');
    expect(prompt).toContain('id: a');
    expect(prompt).toContain('승인 7,800원');
    expect(prompt).toContain('tasks: parse');
    expect(prompt).toContain('tasks: category');
  });
});
