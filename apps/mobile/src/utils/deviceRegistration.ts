interface DeviceUploadState {
  isAvailable: boolean;
  isConfigured: boolean;
  lastUploadError: string | null;
}

const REVOKED = 'device_revoked';

/** 재설치·데이터 삭제로 키가 없거나, 서버에서 키가 폐기됐으면 새 업로드 키를 발급해야 한다 */
export function needsDeviceRegistration({ isAvailable, isConfigured, lastUploadError }: DeviceUploadState): boolean {
  if (!isAvailable) return false;
  return !isConfigured || lastUploadError === REVOKED;
}
