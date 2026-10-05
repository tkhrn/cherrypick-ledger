import { useCallback } from 'react';
import { useInstalledApps } from './useInstalledApps';

const SMS_LABEL = '문자';

/** 패키지명을 사람이 읽을 앱 이름으로 바꾼다 */
export function useAppLabel() {
  const { apps } = useInstalledApps();
  return useCallback(
    (sourcePackage: string) => {
      if (sourcePackage === 'sms') return SMS_LABEL;
      return apps.find((a) => a.packageName === sourcePackage)?.label ?? sourcePackage.split('.').at(-1) ?? sourcePackage;
    },
    [apps],
  );
}
