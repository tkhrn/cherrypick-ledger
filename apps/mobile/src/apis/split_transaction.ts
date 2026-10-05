import { supabase, unwrap } from './supabase';

/** rpc/split_transaction — 고른 원본 알림을 새 결제 건으로 떼어낸다 */
export async function createSplitTransaction(transactionId: string, eventIds: string[]) {
  return unwrap(await supabase.rpc('split_transaction', { p_tx: transactionId, p_event_ids: eventIds }));
}
