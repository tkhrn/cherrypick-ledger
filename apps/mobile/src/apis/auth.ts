import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/** 메일의 로그인 링크를 누르면 이 주소로 앱이 열린다 (Supabase Redirect URLs에 cherrypick://** 등록 필요) */
const AUTH_REDIRECT_PATH = 'auth-callback';

export async function createEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: Linking.createURL(AUTH_REDIRECT_PATH) },
  });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
}

/** 로그인 링크로 받은 PKCE code를 세션으로 바꾼다 */
export async function createSessionFromCode(code: string) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw new Error(error.message);
}

export async function deleteSession() {
  await supabase.auth.signOut();
}
