export type EntryRoute = 'loading' | 'sign-in' | 'error' | 'onboarding' | 'app';

interface EntryInput {
  isSessionLoading: boolean;
  isSignedIn: boolean;
  settings: { status: 'pending' } | { status: 'error' } | { status: 'success'; onboardedAt: string | null };
}

/** 앱 진입 화면. 설정을 못 불러왔을 때 온보딩으로 보내면 기기 키·수집 앱이 다시 덮어써지므로 재시도 화면을 띄운다 */
export function entryRoute({ isSessionLoading, isSignedIn, settings }: EntryInput): EntryRoute {
  if (isSessionLoading) return 'loading';
  if (!isSignedIn) return 'sign-in';
  if (settings.status === 'pending') return 'loading';
  if (settings.status === 'error') return 'error';
  return settings.onboardedAt ? 'app' : 'onboarding';
}
