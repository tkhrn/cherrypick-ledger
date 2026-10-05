import { useQueryClient } from '@tanstack/react-query';
import { clearCapture } from '@modules/notification-capture';
import { deleteSession } from '@/apis/auth';

/** 로그아웃: 기기 업로드 키·대기열과 화면 캐시를 지워 다른 계정에 섞이지 않게 한다 */
export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    clearCapture();
    await deleteSession();
    queryClient.clear();
  };
}
