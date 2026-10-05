import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { flushCapture, getCaptureStatus, importActiveNotifications, importPastSms } from '@modules/notification-capture';
import { createOrganizeRun } from '@/apis/organize';
import { requestReadSmsPermission } from '@/utils/smsPermission';
import { useHistoryImport } from './useHistoryImport';

jest.mock('@modules/notification-capture', () => ({
  importPastSms: jest.fn(async () => 4),
  importActiveNotifications: jest.fn(() => 1),
  flushCapture: jest.fn(),
  getCaptureStatus: jest.fn(() => ({ pendingCount: 0, lastCapturedAt: null, lastUploadError: null, isConfigured: true })),
}));
jest.mock('@/utils/smsPermission', () => ({ requestReadSmsPermission: jest.fn(async () => true) }));
jest.mock('@/apis/organize', () => ({ createOrganizeRun: jest.fn(async () => ({ status: 'succeeded', processed: 5 })) }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { mutations: { retry: 0 } } }) }, children);

describe('useHistoryImport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('imports, waits for the upload, then organizes right away', async () => {
    jest.mocked(getCaptureStatus)
      .mockReturnValueOnce({ pendingCount: 5, lastCapturedAt: null, lastUploadError: null, isConfigured: true })
      .mockReturnValue({ pendingCount: 0, lastCapturedAt: null, lastUploadError: null, isConfigured: true });
    const { result } = await renderHook(() => useHistoryImport({ pollIntervalMs: 1 }), { wrapper });

    await act(async () => result.current.run(30));

    await waitFor(() => expect(result.current.result).toEqual({ sms: 4, notifications: 1, smsDenied: false, organized: 5 }));
    expect(importPastSms).toHaveBeenCalledWith(30);
    expect(flushCapture).toHaveBeenCalled();
    expect(createOrganizeRun).toHaveBeenCalledTimes(1);
  });

  it('skips organizing when nothing new was imported', async () => {
    jest.mocked(importPastSms).mockResolvedValueOnce(0);
    jest.mocked(importActiveNotifications).mockReturnValueOnce(0);
    const { result } = await renderHook(() => useHistoryImport({ pollIntervalMs: 1 }), { wrapper });
    await act(async () => result.current.run(30));
    await waitFor(() => expect(result.current.result).toEqual({ sms: 0, notifications: 0, smsDenied: false, organized: 0 }));
    expect(createOrganizeRun).not.toHaveBeenCalled();
  });

  it('still imports notifications when SMS reading is denied', async () => {
    jest.mocked(requestReadSmsPermission).mockResolvedValueOnce(false);
    const { result } = await renderHook(() => useHistoryImport({ pollIntervalMs: 1 }), { wrapper });
    await act(async () => result.current.run(30));
    await waitFor(() => expect(result.current.result).toMatchObject({ sms: 0, notifications: 1, smsDenied: true }));
    expect(importPastSms).not.toHaveBeenCalled();
  });
});
