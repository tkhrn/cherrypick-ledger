import { screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import AuthCallbackPage from './index';
import { createSessionFromCode } from '@/apis/auth';
import { renderWithQuery } from '@/test/renderWithQuery';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useLocalSearchParams: () => mockParams }));
jest.mock('@/apis/auth', () => ({ createSessionFromCode: jest.fn(async () => undefined) }));
jest.mock('@/apis/user_settings', () => ({ getUserSettings: jest.fn(async () => ({ onboarded_at: null })) }));

describe('AuthCallbackPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exchanges the code and sends a new user to onboarding', async () => {
    mockParams = { code: 'abc' };
    await renderWithQuery(<AuthCallbackPage />);
    await waitFor(() => expect(createSessionFromCode).toHaveBeenCalledWith('abc'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/onboarding'));
  });

  it('explains an expired or broken link', async () => {
    mockParams = { error_description: 'Email link is invalid or has expired' };
    await renderWithQuery(<AuthCallbackPage />);
    expect(await screen.findByText('로그인 링크가 만료됐거나 올바르지 않아요')).toBeTruthy();
    expect(createSessionFromCode).not.toHaveBeenCalled();
  });
});
