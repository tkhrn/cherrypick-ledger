import { useQuery } from '@tanstack/react-query';
import { getAutoHiddenCount } from '@/apis/transactions';

/** 정리 목록이 비었을 때 보여줄 자동 숨김 건수 */
export function useAutoHiddenCount() {
  const { data } = useQuery({ queryKey: ['transactions', 'auto_hidden_count'], queryFn: getAutoHiddenCount });
  return data ?? 0;
}
