import { render, screen } from '@testing-library/react-native';
import { ImportProgress } from './ImportProgress';

describe('ImportProgress', () => {
  it('shows the current step with its description and position', async () => {
    await render(<ImportProgress phase="uploading" />);
    expect(screen.getByText('서버로 올리는 중')).toBeTruthy();
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByText(/가져온 문자와 알림을 올리고 있어요/)).toBeTruthy();
  });

  it('explains that organizing can take a while', async () => {
    await render(<ImportProgress phase="organizing" />);
    expect(screen.getByText('정리하는 중')).toBeTruthy();
    expect(screen.getByText('3/3')).toBeTruthy();
    expect(screen.getByText(/조금 걸릴 수 있어요/)).toBeTruthy();
  });
});
