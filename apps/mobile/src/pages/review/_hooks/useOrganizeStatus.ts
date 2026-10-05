import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrganizeRun } from '@/apis/organize';
import { getLatestOrganizeRun } from '@/apis/organize_runs';
import { getUnprocessedCount } from '@/apis/raw_notifications';
import type { OrganizeState } from '@/components/molecules/OrganizeStatusBar';
import { nextOrganizeRunLabel } from '@/utils/kstDate';

const STALE_RUN_MS = 10 * 60 * 1000;
const POLL_WHILE_RUNNING_MS = 3000;

/** 아직 정리 안 된 알림 수, 최근 정리 실행 상태, 지금 정리하기 */
export function useOrganizeStatus() {
  const queryClient = useQueryClient();
  const latestRun = useQuery({
    queryKey: ['organize_runs', 'latest'],
    queryFn: getLatestOrganizeRun,
    refetchInterval: (query) => (query.state.data?.status === 'running' ? POLL_WHILE_RUNNING_MS : false),
  });
  const unprocessed = useQuery({ queryKey: ['raw_notifications', 'unprocessed'], queryFn: getUnprocessedCount });

  const run = useMutation({
    mutationFn: createOrganizeRun,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['raw_notifications'] });
      queryClient.invalidateQueries({ queryKey: ['organize_runs'] });
    },
  });

  const last = latestRun.data;
  // 10분 넘게 끝나지 않은 실행은 멈춘 것으로 본다 (조회 시각 기준)
  const isServerRunning = last?.status === 'running' && latestRun.dataUpdatedAt - Date.parse(last.started_at) < STALE_RUN_MS;
  const lastFailed = run.isError || (last?.status === 'failed' && (unprocessed.data ?? 0) > 0);

  const state: OrganizeState = run.isPending || isServerRunning
    ? { type: 'running' }
    : lastFailed
      ? { type: 'failed' }
      : { type: 'idle', unprocessedCount: unprocessed.data ?? 0, nextRunLabel: nextOrganizeRunLabel() };

  return { state, runNow: () => run.mutate() };
}
