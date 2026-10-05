import { useQuery } from '@tanstack/react-query';
import { getAiCallsSince } from '@/apis/organize_runs';
import { kstMonthRange, todayKstDayKey } from '@/utils/kstDate';
import { useUserSettings } from './useUserSettings';

export function useAiUsage() {
  const [year, month] = todayKstDayKey().split('-').map(Number) as [number, number];
  const { from } = kstMonthRange(year, month);
  const { settings } = useUserSettings();
  const query = useQuery({ queryKey: ['organize_runs', 'ai_calls', from], queryFn: () => getAiCallsSince(from) });
  return { calls: query.data ?? 0, cap: settings?.ai_monthly_call_cap ?? 0 };
}
