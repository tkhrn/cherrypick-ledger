const DAY_MS = 24 * 60 * 60 * 1000;

export type CaptureProblem = 'not_configured' | 'permission_off' | 'stale';

interface CaptureHealthInput {
  isAvailable: boolean;
  isConfigured: boolean;
  isGranted: boolean;
  lastCapturedAt: number | null;
  dismissedAt: number | null;
  now: number;
}

/** 수집 이상 배너를 띄울 이유. 닫은 뒤 24시간은 다시 띄우지 않는다 */
export function captureHealth({ isAvailable, isConfigured, isGranted, lastCapturedAt, dismissedAt, now }: CaptureHealthInput): CaptureProblem | null {
  if (!isAvailable) return null;
  if (dismissedAt !== null && now - dismissedAt < DAY_MS) return null;
  if (!isConfigured) return 'not_configured';
  if (!isGranted) return 'permission_off';
  if (lastCapturedAt !== null && now - lastCapturedAt > DAY_MS) return 'stale';
  return null;
}
