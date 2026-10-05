import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

/** 로그인 결과가 돌아오는 앱 주소 (Supabase Redirect URLs에 cherrypick://** 등록 필요) */
const AUTH_REDIRECT_PATH = 'auth-callback';
const authRedirectUrl = () => Linking.createURL(AUTH_REDIRECT_PATH);

export async function createEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
}

// 같은 code가 로그인 창 결과와 앱 링크(auth-callback) 양쪽으로 들어올 수 있어서 한 번만 교환한다
const exchanges = new Map<string, Promise<void>>();

/** 로그인 링크·OAuth로 받은 PKCE code를 세션으로 바꾼다 */
export function createSessionFromCode(code: string): Promise<void> {
  const pending = exchanges.get(code);
  if (pending) return pending;
  const exchange = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
    if (error) throw new Error(error.message);
  });
  exchanges.set(code, exchange);
  return exchange;
}

export type OAuthResult = 'signed_in' | 'cancelled';

/** Google 로그인 창을 앱 안에서 열고, 돌아온 code로 세션을 만든다 */
export async function createGoogleSession(): Promise<OAuthResult> {
  const redirectTo = authRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw new Error(error?.message ?? 'Google 로그인을 시작하지 못했어요');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';

  const { queryParams } = Linking.parse(result.url);
  if (queryParams?.error_description) throw new Error(String(queryParams.error_description));
  if (typeof queryParams?.code !== 'string') throw new Error('로그인 결과를 받지 못했어요');
  await createSessionFromCode(queryParams.code);
  return 'signed_in';
}

export async function deleteSession() {
  await supabase.auth.signOut();
}
