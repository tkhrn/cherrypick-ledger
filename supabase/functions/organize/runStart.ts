export type RunStart =
  | { kind: 'started'; runId: string }
  | { kind: 'already_running' }
  | { kind: 'failed'; message: string };

/** start_organize_run RPC 결과 해석. 잠금 때문에 id가 없는 경우와 RPC 자체가 실패한 경우를 구분한다 */
export function interpretRunStart({ data, error }: { data: string | null; error: { message: string } | null }): RunStart {
  if (error) return { kind: 'failed', message: error.message };
  if (!data) return { kind: 'already_running' };
  return { kind: 'started', runId: data };
}
