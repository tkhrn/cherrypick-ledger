import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { isCaptureAvailable, isNotificationAccessGranted, openNotificationAccessSettings } from '@modules/notification-capture';

/** 알림 접근 권한. 시스템 설정에서 돌아올 때마다 다시 확인한다 */
export function useNotificationAccess() {
  const [isGranted, setIsGranted] = useState(isNotificationAccessGranted);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setIsGranted(isNotificationAccessGranted());
    });
    return () => subscription.remove();
  }, []);

  return { isGranted, isAvailable: isCaptureAvailable, openSettings: openNotificationAccessSettings };
}
