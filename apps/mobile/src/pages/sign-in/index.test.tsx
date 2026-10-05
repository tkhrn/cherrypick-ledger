import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignInPage from './index';
import { createEmailOtp, createGoogleSession, verifyEmailOtp } from '@/apis/auth';

jest.mock('@/apis/auth', () => ({
  createEmailOtp: jest.fn(async () => undefined),
  verifyEmailOtp: jest.fn(async () => undefined),
  createGoogleSession: jest.fn(async () => undefined),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <SignInPage />
    </QueryClientProvider>,
  );
}

describe('SignInPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('signs in with Google as the main option', async () => {
    await renderPage();
    await fireEvent.press(screen.getByText('Google로 계속하기'));
    await waitFor(() => expect(createGoogleSession).toHaveBeenCalled());
  });

  it('keeps email sign-in behind a secondary option', async () => {
    await renderPage();
    expect(screen.queryByPlaceholderText('name@example.com')).toBeNull();
    await fireEvent.press(screen.getByText('이메일로 로그인'));
    expect(screen.getByPlaceholderText('name@example.com')).toBeTruthy();
  });

  it('sends a code to the email, then verifies it', async () => {
    await renderPage();
    await fireEvent.press(screen.getByText('이메일로 로그인'));

    await fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'me@example.com');
    await fireEvent.press(screen.getByText('로그인 링크 받기'));

    await waitFor(() => expect(createEmailOtp).toHaveBeenCalledWith('me@example.com'));
    await fireEvent.changeText(await screen.findByPlaceholderText('메일로 받은 코드'), '123456');
    await fireEvent.press(screen.getByText('로그인'));

    await waitFor(() => expect(verifyEmailOtp).toHaveBeenCalledWith('me@example.com', '123456'));
  });

  it('shows an inline error for an invalid email', async () => {
    await renderPage();
    await fireEvent.press(screen.getByText('이메일로 로그인'));
    await fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'nope');
    await fireEvent.press(screen.getByText('로그인 링크 받기'));
    expect(await screen.findByText('이메일 주소를 확인해 주세요')).toBeTruthy();
    expect(createEmailOtp).not.toHaveBeenCalledWith('nope');
  });
});
