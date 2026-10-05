import { entryRoute } from './entryRoute';

describe('entryRoute', () => {
  const signedIn = { isSessionLoading: false, isSignedIn: true };

  it('waits while the session or settings load', () => {
    expect(entryRoute({ isSessionLoading: true, isSignedIn: false, settings: { status: 'pending' } })).toBe('loading');
    expect(entryRoute({ ...signedIn, settings: { status: 'pending' } })).toBe('loading');
  });

  it('sends signed-out users to sign in', () => {
    expect(entryRoute({ isSessionLoading: false, isSignedIn: false, settings: { status: 'pending' } })).toBe('sign-in');
  });

  it('shows a retry screen instead of onboarding when settings fail to load', () => {
    expect(entryRoute({ ...signedIn, settings: { status: 'error' } })).toBe('error');
  });

  it('routes by onboarding state once settings load', () => {
    expect(entryRoute({ ...signedIn, settings: { status: 'success', onboardedAt: null } })).toBe('onboarding');
    expect(entryRoute({ ...signedIn, settings: { status: 'success', onboardedAt: '2026-10-05T00:00:00Z' } })).toBe('app');
  });
});
