import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReviewEmptyState } from './ReviewEmptyState';

describe('ReviewEmptyState', () => {
  it('links to the items that were hidden automatically', async () => {
    const onPressHidden = jest.fn();
    await render(<ReviewEmptyState autoHiddenCount={4} onPressHidden={onPressHidden} />);
    await fireEvent.press(screen.getByText('자동으로 숨긴 건 4개 보기'));
    expect(onPressHidden).toHaveBeenCalled();
  });

  it('shows no hidden link when nothing was hidden', async () => {
    await render(<ReviewEmptyState autoHiddenCount={0} onPressHidden={jest.fn()} />);
    expect(screen.getByText('오늘은 다 정리했어요')).toBeTruthy();
    expect(screen.queryByText(/숨긴 건/)).toBeNull();
  });
});
