import { captureHealth } from './captureHealth';

const HOUR = 60 * 60 * 1000;
const now = Date.parse('2026-10-05T12:00:00Z');
const base = { isAvailable: true, isConfigured: true, isGranted: true, lastCapturedAt: now - HOUR, dismissedAt: null, now };

describe('captureHealth', () => {
  it('is healthy when access is on and capture is recent', () => {
    expect(captureHealth(base)).toBeNull();
  });

  it('flags a device that is not connected for upload', () => {
    expect(captureHealth({ ...base, isConfigured: false })).toBe('not_configured');
  });

  it('flags turned-off notification access', () => {
    expect(captureHealth({ ...base, isGranted: false })).toBe('permission_off');
  });

  it('flags no capture for over 24 hours', () => {
    expect(captureHealth({ ...base, lastCapturedAt: now - 25 * HOUR })).toBe('stale');
  });

  it('stays quiet for a day after the banner is dismissed', () => {
    expect(captureHealth({ ...base, isGranted: false, dismissedAt: now - 2 * HOUR })).toBeNull();
    expect(captureHealth({ ...base, isGranted: false, dismissedAt: now - 25 * HOUR })).toBe('permission_off');
  });

  it('says nothing when capture is unavailable in this build or nothing was captured yet', () => {
    expect(captureHealth({ ...base, isAvailable: false, isGranted: false })).toBeNull();
    expect(captureHealth({ ...base, lastCapturedAt: null })).toBeNull();
  });
});
