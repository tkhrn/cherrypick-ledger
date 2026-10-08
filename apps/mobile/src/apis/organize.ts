import { supabase } from './supabase';

export interface OrganizeResponseDTO {
  status: 'succeeded' | 'already_running' | 'failed';
  processed: number;
}

/** functions/v1/organize — 지금 정리하기 */
export async function createOrganizeRun(): Promise<OrganizeResponseDTO> {
  const { data, error } = await supabase.functions.invoke<OrganizeResponseDTO>('organize', { body: {} });
  if (error || !data) throw new Error(error?.message ?? 'organize failed');
  if (data.status === 'failed') throw new Error('organize failed');
  return data;
}
