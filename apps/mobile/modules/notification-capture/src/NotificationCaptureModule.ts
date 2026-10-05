import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { CaptureStatus, InstalledApp } from './NotificationCapture.types';

declare class NotificationCaptureNative extends NativeModule<Record<string, never>> {
  isNotificationAccessGranted(): boolean;
  openNotificationAccessSettings(): void;
  getInstalledApps(): Promise<InstalledApp[]>;
  configure(ingestUrl: string, deviceKey: string): void;
  setSources(packages: string[], smsEnabled: boolean): void;
  getStatus(): CaptureStatus;
  flushNow(): void;
  clear(): void;
  importSms(days: number): Promise<number>;
  importActiveNotifications(): number;
}

/** 안드로이드 개발 빌드에서만 존재한다. Expo Go·iOS·테스트에서는 null. */
export default requireOptionalNativeModule<NotificationCaptureNative>('NotificationCapture');
