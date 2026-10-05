import { fireEvent, render, screen } from '@testing-library/react-native';
import { MonthCalendar } from './MonthCalendar';

describe('MonthCalendar', () => {
  const props = {
    year: 2026,
    month: 10,
    sums: new Map([['2026-10-05', 74700]]),
    pendingDays: new Set(['2026-10-05']),
    todayKey: '2026-10-05',
    selectedDay: null,
  };

  it('shows each day with its total and marks days still to review', async () => {
    await render(<MonthCalendar {...props} onSelectDay={jest.fn()} />);
    expect(screen.getByText('74,700')).toBeTruthy();
    expect(screen.getByLabelText('10월 5일 74,700원, 정리할 건 있음')).toBeTruthy();
  });

  it('selects a past day but not a future one', async () => {
    const onSelectDay = jest.fn();
    await render(<MonthCalendar {...props} onSelectDay={onSelectDay} />);
    await fireEvent.press(screen.getByLabelText('10월 3일'));
    expect(onSelectDay).toHaveBeenCalledWith('2026-10-03');
    await fireEvent.press(screen.getByLabelText('10월 20일'));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
  });
});
