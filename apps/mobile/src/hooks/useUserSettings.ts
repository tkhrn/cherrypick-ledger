import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserSettings, updateUserSettings, type UserSettingsDTO } from '@/apis/user_settings';

export type UserSettings = UserSettingsDTO;

const userSettingsKey = ['user_settings'] as const;

export function useUserSettings({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: userSettingsKey, queryFn: getUserSettings, enabled });
  const save = useMutation({
    mutationFn: updateUserSettings,
    onSettled: () => queryClient.invalidateQueries({ queryKey: userSettingsKey }),
  });
  return { settings: query.data ?? null, isLoading: query.isLoading, save };
}
