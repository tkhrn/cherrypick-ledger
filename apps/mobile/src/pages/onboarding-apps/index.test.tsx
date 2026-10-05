import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import OnboardingAppsPage from './index';
import { renderWithQuery } from '@/test/renderWithQuery';
import { updateSourceApps } from '@/apis/source_apps';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ sms: '1' }),
}));
jest.mock('@modules/notification-capture', () => ({
  getInstalledApps: jest.fn(async () => [
    { packageName: 'com.nhn.android.search', label: '네이버' },
    { packageName: 'viva.republica.toss', label: '토스' },
  ]),
  setCaptureSources: jest.fn(),
}));
jest.mock('@/apis/source_apps', () => ({ getSourceApps: jest.fn(async () => []), updateSourceApps: jest.fn(async () => undefined) }));
jest.mock('@/apis/user_settings', () => ({ getUserSettings: jest.fn(async () => null), updateUserSettings: jest.fn(async () => undefined) }));

describe('OnboardingAppsPage', () => {
  it('lists likely financial apps first and saves the selection', async () => {
    await renderWithQuery(<OnboardingAppsPage />);

    expect(await screen.findByText('금융앱으로 보여요')).toBeTruthy();
    await fireEvent.press(screen.getByText('토스'));
    await fireEvent.press(screen.getByText(/^다음/));

    await waitFor(() => expect(updateSourceApps).toHaveBeenCalledWith([{ packageName: 'viva.republica.toss', label: '토스' }]));
    expect(router.push).toHaveBeenCalledWith('/onboarding/accounts');
  });

  it('asks for at least one app', async () => {
    await renderWithQuery(<OnboardingAppsPage />);
    await screen.findByText('토스');
    await fireEvent.press(screen.getByText(/^다음/));
    expect(await screen.findByText('앱을 하나 이상 골라 주세요')).toBeTruthy();
  });
});
