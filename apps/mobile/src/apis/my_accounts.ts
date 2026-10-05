import { supabase, unwrap, unwrapList } from './supabase';

export interface MyAccountDTO {
  id: string;
  bank_name: string;
  last4: string;
  alias: string | null;
}

export async function getMyAccounts(): Promise<MyAccountDTO[]> {
  return unwrapList(await supabase.from('my_accounts').select('id, bank_name, last4, alias').order('created_at'));
}

export async function createMyAccount(account: { bankName: string; last4: string; alias?: string }) {
  unwrap(await supabase.from('my_accounts').insert({ bank_name: account.bankName, last4: account.last4, alias: account.alias ?? null }));
}

export async function deleteMyAccount(id: string) {
  unwrap(await supabase.from('my_accounts').delete().eq('id', id));
}
