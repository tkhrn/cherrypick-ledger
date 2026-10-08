// PKCE(SHA-256)에 필요한 WebCrypto를 클라이언트보다 먼저 채운다
import '@/polyfills';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

/** supabase-js 결과에서 에러를 throw로 바꿔 훅이 성공 경로만 다루게 한다 */
export function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

/** 목록 조회용: 에러는 throw, null은 빈 배열 */
export function unwrapList<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  return unwrap(result) ?? [];
}
