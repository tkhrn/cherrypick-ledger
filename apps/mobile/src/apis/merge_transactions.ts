import { supabase, unwrap } from './supabase';

/** rpc/merge_transactions — source의 원본 알림을 target으로 옮기고 source를 지운다 */
export async function createMergedTransaction(targetId: string, sourceId: string) {
  unwrap(await supabase.rpc('merge_transactions', { p_target: targetId, p_source: sourceId }));
}
