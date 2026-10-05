import { useMutation, useQueryClient } from '@tanstack/react-query';
import { configureUpload } from '@modules/notification-capture';
import { createDevice } from '@/apis/register_device';
import { SUPABASE_URL } from '@/apis/supabase';
import { updateUserSettings } from '@/apis/user_settings';

const DEVICE_LABEL = 'android';

/** 기기 업로드 키를 발급해 수집 모듈에 넘기고 첫 설정을 끝낸다 */
export function useFinishOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const deviceKey = await createDevice(DEVICE_LABEL);
      configureUpload({ ingestUrl: `${SUPABASE_URL}/functions/v1/ingest`, deviceKey });
      await updateUserSettings({ onboarded_at: new Date().toISOString() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_settings'] }),
  });
}
