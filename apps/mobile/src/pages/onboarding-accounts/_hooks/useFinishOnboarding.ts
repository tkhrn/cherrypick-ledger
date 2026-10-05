import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserSettings } from '@/apis/user_settings';
import { connectDevice } from '@/hooks/useDeviceRegistration';

/** 기기 업로드 키를 발급해 수집 모듈에 넘기고 첫 설정을 끝낸다 */
export function useFinishOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await connectDevice();
      await updateUserSettings({ onboarded_at: new Date().toISOString() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user_settings'] }),
  });
}
