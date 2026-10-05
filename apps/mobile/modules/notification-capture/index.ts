import NativeCapture from './src/NotificationCaptureModule';
import type { CaptureSources, CaptureStatus, InstalledApp, UploadConfig } from './src/NotificationCapture.types';

export type { CaptureSources, CaptureStatus, InstalledApp, UploadConfig };

const UNAVAILABLE_STATUS: CaptureStatus = { lastCapturedAt: null, pendingCount: 0, lastUploadError: 'unavailable', isConfigured: false };

export const isCaptureAvailable = NativeCapture !== null;

export function isNotificationAccessGranted(): boolean {
  return NativeCapture?.isNotificationAccessGranted() ?? false;
}

export function openNotificationAccessSettings(): void {
  NativeCapture?.openNotificationAccessSettings();
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  return (await NativeCapture?.getInstalledApps()) ?? [];
}

export function configureUpload({ ingestUrl, deviceKey }: UploadConfig): void {
  NativeCapture?.configure(ingestUrl, deviceKey);
}

export function setCaptureSources({ packages, smsEnabled }: CaptureSources): void {
  NativeCapture?.setSources(packages, smsEnabled);
}

export function getCaptureStatus(): CaptureStatus {
  return NativeCapture?.getStatus() ?? UNAVAILABLE_STATUS;
}

export function flushCapture(): void {
  NativeCapture?.flushNow();
}

/** 로그아웃 시 업로드 키·대기열·상태를 지운다 */
export function clearCapture(): void {
  NativeCapture?.clear();
}

/** 지난 days일 동안 받은 결제·이체 문자를 대기열에 넣는다. 새로 넣은 개수를 돌려준다 (READ_SMS 권한 필요) */
export async function importPastSms(days: number): Promise<number> {
  return (await NativeCapture?.importSms(days)) ?? 0;
}

/** 아직 알림창에 남아 있는, 고른 앱의 알림을 대기열에 넣는다 */
export function importActiveNotifications(): number {
  return NativeCapture?.importActiveNotifications() ?? 0;
}
