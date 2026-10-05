import { supabase, unwrap } from './supabase';

export interface OrganizeRunDTO {
  status: string;
  started_at: string;
  ai_calls: number;
  ai_error: string | null;
}

export async function getLatestOrganizeRun(): Promise<OrganizeRunDTO | null> {
  return unwrap(await supabase.from('organize_runs').select('status, started_at, ai_calls, ai_error').order('started_at', { ascending: false }).limit(1).maybeSingle());
}

export async function getAiCallsSince(fromIso: string): Promise<number> {
  const rows = unwrap(await supabase.from('organize_runs').select('ai_calls').gte('started_at', fromIso)) ?? [];
  return rows.reduce((sum, r) => sum + r.ai_calls, 0);
}
