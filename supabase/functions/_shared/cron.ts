import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** cron 호출 확인. 원격은 DB Vault의 비밀값, 로컬 테스트는 CRON_SECRET 환경변수를 쓴다 */
export async function isCronCall(admin: SupabaseClient, token: string): Promise<boolean> {
  if (!token) return false;
  const envSecret = Deno.env.get('CRON_SECRET');
  if (envSecret && token === envSecret) return true;
  const { data } = await admin.rpc('is_cron_secret', { p_token: token });
  return data === true;
}
