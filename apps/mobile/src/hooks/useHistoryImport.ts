import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importActiveNotifications, importPastSms } from '@modules/notification-capture';
import { requestReadSmsPermission } from '@/utils/smsPermission';

export const DEFAULT_IMPORT_DAYS = 30;

export interface HistoryImportResult {
  sms: number;
  notifications: number;
  smsDenied: boolean;
}

/** 설정 전에 받은 결제 문자와 알림창에 남은 알림을 가져온다. 업로드·정리는 평소 흐름을 탄다 */
export function useHistoryImport() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (days: number): Promise<HistoryImportResult> => {
      const canReadSms = await requestReadSmsPermission();
      const sms = canReadSms ? await importPastSms(days) : 0;
      return { sms, notifications: importActiveNotifications(), smsDenied: !canReadSms };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['capture_status'] }),
  });
  return { run: (days: number) => mutation.mutate(days), isRunning: mutation.isPending, result: mutation.data ?? null, error: mutation.error };
}
