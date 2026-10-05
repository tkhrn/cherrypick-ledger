import { formatWon } from './won';

describe('formatWon', () => {
  it.each([
    [0, '0원'],
    [5600, '5,600원'],
    [1234567, '1,234,567원'],
  ])('%d → %s', (amount, text) => {
    expect(formatWon(amount)).toBe(text);
  });

  it('shows a dash for an unknown amount', () => {
    expect(formatWon(null)).toBe('—');
  });
});
