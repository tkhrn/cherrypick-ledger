import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getCaptureStatus, isCaptureAvailable, isNotificationAccessGranted, type CaptureStatus } from '@modules/notification-capture';
import { captureHealth } from '@/utils/captureHealth';

const DISMISSED_KEY = 'capture-banner-dismissed-at';

interface Snapshot {
  isGranted: boolean;
  status: CaptureStatus;
  checkedAt: number;
}

const readSnapshot = (): Snapshot => ({ isGranted: isNotificationAccessGranted(), status: getCaptureStatus(), checkedAt: Date.now() });

/** 수집 모듈 상태(권한·마지막 수집·업로드 대기)와 배너 표시 여부 */
export function useCaptureHealth() {
  const [snapshot, setSnapshot] = useState<Snapshot>(readSnapshot);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((v) => setDismissedAt(v ? Number(v) : null)).catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setSnapshot(readSnapshot());
    });
    return () => subscription.remove();
  }, []);

  const problem = captureHealth({
    isAvailable: isCaptureAvailable,
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

  return { problem, status: snapshot.status, isAvailable: isCaptureAvailable, isGranted: snapshot.isGranted, dismiss, refresh: () => setSnapshot(readSnapshot()) };
}
