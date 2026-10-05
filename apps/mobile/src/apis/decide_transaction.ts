import { supabase, unwrap } from './supabase';

export interface DecisionPayload {
  id: string;
  status: 'pending' | 'mine' | 'group' | 'ignored';
  categoryId: string | null;
  groupId: string | null;
  memo: string | null;
  merchantKey: string | null;
}

/** rpc/decide_transaction */
export async function updateTransactionDecision(p: DecisionPayload) {
  unwrap(await supabase.rpc('decide_transaction', {
    p_id: p.id, p_status: p.status, p_category_id: p.categoryId as string, p_group_id: p.groupId as string,
    p_memo: p.memo as string, p_merchant_key: p.merchantKey as string,
  }));
}
