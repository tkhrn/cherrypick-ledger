import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type LedgerViewMode = 'list' | 'calendar';

/** 목록/달력 보기 선택을 화면별로 기억한다 (기기 로컬 편의 설정) */
export function useLedgerViewMode(screenKey: string) {
  const storageKey = `ledger-view-mode:${screenKey}`;
  const [mode, setMode] = useState<LedgerViewMode>('list');

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((saved) => {
        if (saved === 'list' || saved === 'calendar') setMode(saved);
      })
      .catch(() => undefined);
  }, [storageKey]);

  const changeMode = (next: LedgerViewMode) => {
    setMode(next);
    AsyncStorage.setItem(storageKey, next).catch(() => undefined);
  };

  return { mode, changeMode };
}
