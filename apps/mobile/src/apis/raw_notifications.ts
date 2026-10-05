import { supabase } from './supabase';

export async function getUnprocessedCount(): Promise<number> {
  const { count, error } = await supabase.from('raw_notifications').select('id', { count: 'exact', head: true }).is('processed_at', null).lt('attempts', 3);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
