import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMyAccount, deleteMyAccount, getMyAccounts, type MyAccountDTO } from '@/apis/my_accounts';

export type MyAccount = MyAccountDTO;

const myAccountsKey = ['my_accounts'] as const;

export function useMyAccounts() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: myAccountsKey });
  const query = useQuery({ queryKey: myAccountsKey, queryFn: getMyAccounts });
  const add = useMutation({ mutationFn: createMyAccount, onSettled: invalidate });
  const remove = useMutation({ mutationFn: deleteMyAccount, onSettled: invalidate });
  return { accounts: query.data ?? [], isLoading: query.isLoading, add, remove };
}
