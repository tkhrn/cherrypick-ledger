import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

// 로컬 스택(`supabase start`) 대상 통합 테스트용 값. `supabase status -o env`에서 읽는다.
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://127.0.0.1:54321';
export const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
export const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function createTestUser() {
  const email = `test-${crypto.randomUUID()}@test.dev`;
  const password = 'test-password-123';
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data: session, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { userId: data.user.id, client, accessToken: session.session!.access_token };
}

export async function registerDevice(client: SupabaseClient) {
  const { data, error } = await client.rpc('register_device', { p_label: 'test' });
  if (error) throw error;
  return data as string;
}

export function ingest(deviceKey: string, items: unknown[]) {
  return fetch(`${FUNCTIONS_URL}/ingest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-device-key': deviceKey },
    body: JSON.stringify({ items }),
  });
}
