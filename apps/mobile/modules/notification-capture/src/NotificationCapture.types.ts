export interface InstalledApp {
  packageName: string;
  label: string;
}

export interface CaptureStatus {
  lastCapturedAt: number | null;
  pendingCount: number;
  lastUploadError: string | null;
  isConfigured: boolean;
}

export interface UploadConfig {
  ingestUrl: string;
  deviceKey: string;
}

export interface CaptureSources {
  packages: string[];
  smsEnabled: boolean;
}
