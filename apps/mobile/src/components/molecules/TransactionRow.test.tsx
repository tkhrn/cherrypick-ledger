import { render, screen } from '@testing-library/react-native';
import { TransactionRow } from './TransactionRow';

const base = { merchant: '스타벅스', amount: 5600, kind: 'payment' as const, category: { id: 'c', name: '카페·간식', icon: 'coffee', colorToken: 'cat-amber' as const } };

describe('TransactionRow', () => {
  it('shows merchant, formatted amount, category and notice count', async () => {
    await render(<TransactionRow {...base} noticeCount={3} needsReview={false} isCancelled={false} />);
    expect(screen.getByText('스타벅스')).toBeTruthy();
    expect(screen.getByText('5,600원')).toBeTruthy();
    expect(screen.getByText('카페·간식 · 알림 3개')).toBeTruthy();
  });

  it('shows the review badge and a placeholder merchant', async () => {
    await render(<TransactionRow {...base} merchant={null} category={null} noticeCount={1} needsReview isCancelled={false} />);
    expect(screen.getByText('가게 이름 없음')).toBeTruthy();
    expect(screen.getByText('확인 필요')).toBeTruthy();
  });
});
