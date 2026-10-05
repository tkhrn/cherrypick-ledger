import { supabase, unwrap } from './supabase';

export interface UserSettingsDTO {
  user_id: string;
  onboarded_at: string | null;
  digest_time: string;
  ai_monthly_call_cap: number;
  expo_push_token: string | null;
  sms_enabled: boolean;
}

export async function getUserSettings(): Promise<UserSettingsDTO | null> {
  return unwrap(await supabase.from('user_settings').select('*').maybeSingle());
}

export async function updateUserSettings(patch: Partial<Omit<UserSettingsDTO, 'user_id'>>) {
  const { data: auth } = await supabase.auth.getUser();
  unwrap(await supabase.from('user_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('user_id', auth.user?.id ?? ''));
}
