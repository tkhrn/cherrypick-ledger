import { fireEvent, render, screen } from '@testing-library/react-native';
import { OrganizeStatusBar } from './OrganizeStatusBar';

describe('OrganizeStatusBar', () => {
  it('renders nothing when there is nothing waiting', async () => {
    await render(<OrganizeStatusBar state={{ type: 'idle', unprocessedCount: 0, nextRunLabel: '15:00' }} onRun={jest.fn()} />);
    expect(screen.queryByText(/아직 정리 안 된/)).toBeNull();
  });

  it('shows the waiting count and runs on press', async () => {
    const onRun = jest.fn();
    await render(<OrganizeStatusBar state={{ type: 'idle', unprocessedCount: 3, nextRunLabel: '15:00' }} onRun={onRun} />);
    expect(screen.getByText('아직 정리 안 된 알림 3건')).toBeTruthy();
    expect(screen.getByText('다음 자동 정리 15:00')).toBeTruthy();
    await fireEvent.press(screen.getByText('지금 정리하기'));
    expect(onRun).toHaveBeenCalled();
  });

  it('shows progress while running', async () => {
    await render(<OrganizeStatusBar state={{ type: 'running' }} onRun={jest.fn()} />);
    expect(screen.getByText('정리 중…')).toBeTruthy();
    expect(screen.queryByText('지금 정리하기')).toBeNull();
  });

  it('offers a retry after a failure', async () => {
    await render(<OrganizeStatusBar state={{ type: 'failed' }} onRun={jest.fn()} />);
    expect(screen.getByText('정리하지 못했어요')).toBeTruthy();
    expect(screen.getByText('다시 시도')).toBeTruthy();
  });
});
