import { supabase, unwrap, unwrapList } from './supabase';

export const TRANSACTION_SELECT =
  'id, kind, amount, merchant, occurred_at, status, auto_hidden_reason, group_id, memo, needs_review, review_reason, cancelled_at, ' +
  'category:categories(id, name, icon, color_token), parsed_events(id, source_package, raw:raw_notifications(title, body, posted_at))';

export interface TransactionDTO {
  id: string;
  kind: string;
  amount: number | null;
  merchant: string | null;
  occurred_at: string;
  status: string;
  auto_hidden_reason: string | null;
  group_id: string | null;
  memo: string | null;
  needs_review: boolean;
  review_reason: string | null;
  cancelled_at: string | null;
  category: { id: string; name: string; icon: string; color_token: string } | null;
  parsed_events: { id: string; source_package: string; raw: { title: string; body: string; posted_at: string } | null }[];
}

type StatusFilter = 'pending' | 'mine' | 'group' | 'hidden';

export async function getTransactions(filter: { status: StatusFilter; from?: string; to?: string; groupId?: string }): Promise<TransactionDTO[]> {
  let query = supabase.from('transactions').select(TRANSACTION_SELECT).order('occurred_at', { ascending: false });
  query = filter.status === 'hidden' ? query.in('status', ['ignored', 'auto_hidden']) : query.eq('status', filter.status);
  if (filter.from) query = query.gte('occurred_at', filter.from);
  if (filter.to) query = query.lt('occurred_at', filter.to);
  if (filter.groupId) query = query.eq('group_id', filter.groupId);
  return unwrapList(await query) as unknown as TransactionDTO[];
}

/** 가게 이름 직접 고치기 */
export async function updateTransactionMerchant(id: string, merchant: string) {
  unwrap(await supabase.from('transactions').update({ merchant }).eq('id', id));
}
