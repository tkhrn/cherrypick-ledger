import { useQuery } from '@tanstack/react-query';
import { getInstalledApps, type InstalledApp } from '@modules/notification-capture';
import { sortForSelection } from '@/utils/financialApps';

export type { InstalledApp };

export function useInstalledApps() {
  const query = useQuery({ queryKey: ['installed_apps'], queryFn: getInstalledApps, staleTime: Infinity });
  return { apps: sortForSelection(query.data ?? []), isLoading: query.isLoading };
}
