import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { flushCapture, getCaptureStatus, importActiveNotifications, importPastSms } from '@modules/notification-capture';
import { createOrganizeRun } from '@/apis/organize';
import { requestReadSmsPermission } from '@/utils/smsPermission';

export const DEFAULT_IMPORT_DAYS = 30;
const DEFAULT_POLL_INTERVAL_MS = 700;
const MAX_UPLOAD_WAIT_MS = 60_000;

export type HistoryImportPhase = 'idle' | 'reading' | 'uploading' | 'organizing';

export interface HistoryImportResult {
  sms: number;
  notifications: number;
  smsDenied: boolean;
  /** 정리 배치가 처리한 알림 수 */
  organized: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 기기 대기열이 서버로 다 올라갈 때까지 기다린다 (시간 초과면 올라간 만큼만 정리) */
async function waitForUpload(pollIntervalMs: number) {
  const deadline = Date.now() + MAX_UPLOAD_WAIT_MS;
  while (getCaptureStatus().pendingCount > 0 && Date.now() < deadline) await sleep(pollIntervalMs);
}

/** 지난 결제 문자·알림창 알림을 가져와서 업로드하고 바로 정리까지 돌린다 */
export function useHistoryImport({ pollIntervalMs = DEFAULT_POLL_INTERVAL_MS }: { pollIntervalMs?: number } = {}) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<HistoryImportPhase>('idle');

  const mutation = useMutation({
    mutationFn: async (days: number): Promise<HistoryImportResult> => {
      setPhase('reading');
      const canReadSms = await requestReadSmsPermission();
      const sms = canReadSms ? await importPastSms(days) : 0;
      const notifications = importActiveNotifications();
      if (sms + notifications === 0) return { sms, notifications, smsDenied: !canReadSms, organized: 0 };

      setPhase('uploading');
      flushCapture();
      await waitForUpload(pollIntervalMs);

      setPhase('organizing');
      const run = await createOrganizeRun();
      return { sms, notifications, smsDenied: !canReadSms, organized: run.processed };
    },
    onSettled: () => {
      setPhase('idle');
      queryClient.invalidateQueries({ queryKey: ['capture_status'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['raw_notifications'] });
      queryClient.invalidateQueries({ queryKey: ['organize_runs'] });
    },
  });

  return { run: (days: number) => mutation.mutate(days), phase, isRunning: mutation.isPending, result: mutation.data ?? null, error: mutation.error };
}
