import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/components/atoms/Chip';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { LedgerBody } from '@/components/molecules/LedgerBody';
import { MonthHeader } from '@/components/molecules/MonthHeader';
import { TransactionSheet } from '@/components/organisms/TransactionSheet';
import { SPACE } from '@/constants/theme';
import { useGroups } from '@/hooks/useGroups';
import { useLedgerViewMode } from '@/hooks/useLedgerViewMode';
import { useMonthCursor } from '@/hooks/useMonthCursor';
import { usePendingDayKeys } from '@/hooks/usePendingDayKeys';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types/transaction';
import { sumAmounts } from '@/utils/calendar';

export default function GroupsPage() {
  const { status } = useTheme();
  const cursor = useMonthCursor();
  const { mode, changeMode } = useLedgerViewMode('groups');
  const { groups } = useGroups();
  const [groupId, setGroupId] = useState<string | null>(null);
  const { transactions } = useTransactions({ status: 'group', ...cursor.range, ...(groupId ? { groupId } : {}) });
  const pendingDays = usePendingDayKeys();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [opened, setOpened] = useState<Transaction | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name;

  const openSheet = (t: Transaction) => {
    setOpened(t);
    sheetRef.current?.present();
  };

  return (
    <ScreenLayout>
      <MonthHeader title="모임장부" year={cursor.year} month={cursor.month} total={sumAmounts(transactions)} viewMode={mode} onChangeViewMode={changeMode} onPrev={cursor.prev} onNext={cursor.next} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chips}>
        <Chip label="전체" selected={groupId === null} tone={status.group} onPress={() => setGroupId(null)} />
        {groups.filter((g) => !g.archived).map((g) => (
          <Chip key={g.id} label={g.name} selected={groupId === g.id} tone={status.group} onPress={() => setGroupId(g.id)} />
        ))}
      </ScrollView>
      <LedgerBody
        transactions={transactions}
        year={cursor.year}
        month={cursor.month}
        viewMode={mode}
        pendingDays={pendingDays}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        subtitleOf={(t) => groupName(t.groupId)}
        onPressTransaction={openSheet}
        emptyTitle="모임장부가 비어 있어요"
        emptyBody="정리할 때 모임장부를 고르면 여기에 모여요."
      />
      <TransactionSheet ref={sheetRef} transaction={opened ? (transactions.find((t) => t.id === opened.id) ?? opened) : null} onDismiss={() => setOpened(null)} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  chipsRow: { flexGrow: 0 },
  chips: { gap: SPACE.sm, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm },
});
