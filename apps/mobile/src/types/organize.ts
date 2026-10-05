/** 정리 실행 상태. 정리 상태 훅이 만들고 상태 바가 그린다 */
export type OrganizeState =
  | { type: 'idle'; unprocessedCount: number; nextRunLabel: string }
  | { type: 'running' }
  | { type: 'failed' };
