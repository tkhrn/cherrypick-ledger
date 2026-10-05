import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { configureUpload, flushCapture, getCaptureStatus, isCaptureAvailable } from '@modules/notification-capture';
import { createDevice } from '@/apis/register_device';
import { SUPABASE_URL } from '@/apis/supabase';
import { needsDeviceRegistration } from '@/utils/deviceRegistration';

const DEVICE_LABEL = 'android';

/** 새 업로드 키를 발급받아 수집 모듈에 넘긴다 */
export async function connectDevice() {
  const deviceKey = await createDevice(DEVICE_LABEL);
  configureUpload({ ingestUrl: `${SUPABASE_URL}/functions/v1/ingest`, deviceKey });
  flushCapture();
}

/** 재설치·데이터 삭제·키 폐기로 업로드가 끊겼으면 자동으로 다시 연결한다 */
export function useDeviceRegistration() {
  const queryClient = useQueryClient();
  const reconnect = useMutation({
    mutationFn: connectDevice,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['capture_status'] }),
  });
  const { mutate } = reconnect;

  useEffect(() => {
    const status = getCaptureStatus();
    if (needsDeviceRegistration({ isAvailable: isCaptureAvailable, isConfigured: status.isConfigured, lastUploadError: status.lastUploadError })) mutate();
  }, [mutate]);

  return { reconnect: () => reconnect.mutate(), isReconnecting: reconnect.isPending };
}
