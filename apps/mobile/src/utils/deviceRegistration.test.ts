import { needsDeviceRegistration } from './deviceRegistration';

describe('needsDeviceRegistration', () => {
  const healthy = { isAvailable: true, isConfigured: true, lastUploadError: null };

  it('is not needed when the device already has a working key', () => {
    expect(needsDeviceRegistration(healthy)).toBe(false);
  });

  it('is needed after a reinstall or data clear (no key on the device)', () => {
    expect(needsDeviceRegistration({ ...healthy, isConfigured: false })).toBe(true);
  });

  it('is needed when the server revoked the key', () => {
    expect(needsDeviceRegistration({ ...healthy, lastUploadError: 'device_revoked' })).toBe(true);
  });

  it('is never needed where capture is unavailable', () => {
    expect(needsDeviceRegistration({ isAvailable: false, isConfigured: false, lastUploadError: 'unavailable' })).toBe(false);
  });
});
