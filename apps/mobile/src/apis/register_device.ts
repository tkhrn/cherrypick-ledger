import { supabase, unwrap } from './supabase';

/** rpc/register_device — 기기 업로드 키 평문을 한 번만 돌려준다 */
export async function createDevice(label: string): Promise<string> {
  const key = unwrap(await supabase.rpc('register_device', { p_label: label }));
  if (!key) throw new Error('device key was not issued');
  return key;
}
