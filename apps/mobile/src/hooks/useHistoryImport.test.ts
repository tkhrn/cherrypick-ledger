import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { importActiveNotifications, importPastSms } from '@modules/notification-capture';
import { requestReadSmsPermission } from '@/utils/smsPermission';
import { useHistoryImport } from './useHistoryImport';

jest.mock('@modules/notification-capture', () => ({
  importPastSms: jest.fn(async () => 4),
  importActiveNotifications: jest.fn(() => 1),
}));
jest.mock('@/utils/smsPermission', () => ({ requestReadSmsPermission: jest.fn(async () => true) }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { mutations: { retry: 0 } } }) }, children);

describe('useHistoryImport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('imports past texts for the chosen period plus notifications still in the shade', async () => {
    const { result } = await renderHook(() => useHistoryImport(), { wrapper });
    await act(async () => result.current.run(30));
    await waitFor(() => expect(result.current.result).toEqual({ sms: 4, notifications: 1, smsDenied: false }));
    expect(importPastSms).toHaveBeenCalledWith(30);
  });

  it('still imports notifications when SMS reading is denied', async () => {
    jest.mocked(requestReadSmsPermission).mockResolvedValueOnce(false);
    const { result } = await renderHook(() => useHistoryImport(), { wrapper });
    await act(async () => result.current.run(30));
    await waitFor(() => expect(result.current.result).toEqual({ sms: 0, notifications: 1, smsDenied: true }));
    expect(importPastSms).not.toHaveBeenCalled();
    expect(importActiveNotifications).toHaveBeenCalled();
  });
});
