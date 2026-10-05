import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getCaptureStatus, isCaptureAvailable, isNotificationAccessGranted } from '@modules/notification-capture';
import { captureHealth } from '@/utils/captureHealth';

const DISMISSED_KEY = 'capture-banner-dismissed-at';

const readSnapshot = () => ({ isGranted: isNotificationAccessGranted(), status: getCaptureStatus(), checkedAt: Date.now() });

/** 수집 모듈 상태(연결·권한·마지막 수집·업로드 대기)와 배너 표시 여부. 앱이 앞으로 오면 새로 읽는다 */
export function useCaptureHealth() {
  const queryClient = useQueryClient();
  const { data: snapshot = readSnapshot() } = useQuery({ queryKey: ['capture_status'], queryFn: readSnapshot, staleTime: 0 });
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((v) => setDismissedAt(v ? Number(v) : null)).catch(() => undefined);
  }, []);

  const problem = captureHealth({
    isAvailable: isCaptureAvailable,
    isConfigured: snapshot.status.isConfigured,
    isGranted: snapshot.isGranted,
    lastCapturedAt: snapshot.status.lastCapturedAt,
    dismissedAt,
    now: snapshot.checkedAt,
  });

  const dismiss = () => {
    const at = Date.now();
    setDismissedAt(at);
    AsyncStorage.setItem(DISMISSED_KEY, String(at)).catch(() => undefined);
  };

  return {
    problem,
    status: snapshot.status,
    isAvailable: isCaptureAvailable,
    isGranted: snapshot.isGranted,
    dismiss,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['capture_status'] }),
  };
}
