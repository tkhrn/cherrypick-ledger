import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { CategoryBar } from '@/components/molecules/CategoryBar';
import { LedgerBody } from '@/components/molecules/LedgerBody';
import { MonthHeader } from '@/components/molecules/MonthHeader';
import { TransactionSheet } from '@/components/organisms/TransactionSheet';
import { useLedgerViewMode } from '@/hooks/useLedgerViewMode';
import { useMonthCursor } from '@/hooks/useMonthCursor';
import { usePendingDayKeys } from '@/hooks/usePendingDayKeys';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types/transaction';
import { categoryShares, inShare, sumAmounts } from '@/utils/calendar';

export default function SpendingPage() {
  const cursor = useMonthCursor();
  const { mode, changeMode } = useLedgerViewMode('spending');
  const { transactions } = useTransactions({ status: 'mine', ...cursor.range });
  const pendingDays = usePendingDayKeys();
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [opened, setOpened] = useState<Transaction | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  const shares = categoryShares(transactions);
  const visible = categoryKey ? inShare(transactions, shares, categoryKey) : transactions;

  const openSheet = (t: Transaction) => {
    setOpened(t);
    sheetRef.current?.present();
  };

  return (
    <ScreenLayout>
      <MonthHeader title="내 소비" year={cursor.year} month={cursor.month} total={sumAmounts(transactions)} viewMode={mode} onChangeViewMode={changeMode} onPrev={cursor.prev} onNext={cursor.next} />
      <LedgerBody
        header={<CategoryBar shares={shares} selectedKey={categoryKey} onSelect={setCategoryKey} />}
        transactions={visible}
        year={cursor.year}
        month={cursor.month}
        viewMode={mode}
        pendingDays={pendingDays}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onPressTransaction={openSheet}
        emptyTitle="이번 달 기록이 없어요"
        emptyBody="정리 탭에서 내 소비를 고르면 여기에 모여요."
      />
      <TransactionSheet ref={sheetRef} transaction={opened ? (transactions.find((t) => t.id === opened.id) ?? opened) : null} onDismiss={() => setOpened(null)} />
    </ScreenLayout>
  );
}
