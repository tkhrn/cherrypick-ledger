import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setCaptureSources } from '@modules/notification-capture';
import { getSourceApps, updateSourceApps, type SourceAppDTO } from '@/apis/source_apps';
import { updateUserSettings } from '@/apis/user_settings';
import { useUserSettings } from './useUserSettings';

export type SourceApp = SourceAppDTO;

interface SaveSourcesInput {
  selected: { packageName: string; label: string }[];
  smsEnabled: boolean;
}

const sourceAppsKey = ['source_apps'] as const;

/** 수집 대상(분석할 앱 + 문자)을 서버에 저장하고 네이티브 수집 모듈과 맞춘다 */
export function useCaptureSources() {
  const queryClient = useQueryClient();
  const { settings } = useUserSettings();
  const query = useQuery({ queryKey: sourceAppsKey, queryFn: getSourceApps });

  const save = useMutation({
    mutationFn: async ({ selected, smsEnabled }: SaveSourcesInput) => {
      await updateSourceApps(selected);
      await updateUserSettings({ sms_enabled: smsEnabled });
      setCaptureSources({ packages: selected.map((a) => a.packageName), smsEnabled });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sourceAppsKey });
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    },
  });

  const enabledApps = (query.data ?? []).filter((a) => a.enabled);
  return { enabledApps, smsEnabled: settings?.sms_enabled ?? false, isLoading: query.isLoading, save };
}
