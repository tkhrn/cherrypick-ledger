import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { OrganizeStatusBar } from '@/components/molecules/OrganizeStatusBar';
import { CaptureBanner } from '@/components/organisms/CaptureBanner';
import { SwipeableTransactionRow } from '@/components/organisms/SwipeableTransactionRow';
import { TransactionSheet } from '@/components/organisms/TransactionSheet';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import type { Transaction } from '@/types/transaction';
import { formatDayKey, todayKstDayKey } from '@/utils/kstDate';
import { formatWon } from '@/utils/won';
import { DayHeader } from './_components/DayHeader';
import { SelectionBar } from './_components/SelectionBar';
import { UndoSnackbar } from './_components/UndoSnackbar';
import { useOrganizeStatus } from './_hooks/useOrganizeStatus';
import { usePendingDays } from './_hooks/usePendingDays';

export default function ReviewPage() {
  const { colors } = useTheme();
  const { days, count, total, isLoading, refetch } = usePendingDays();
  const { state: organizeState, runNow, refresh: refreshOrganize } = useOrganizeStatus();
  const { decide } = useTransactionDecision();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [opened, setOpened] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ message: string; transactions: Transaction[] } | null>(null);
  const selectionMode = selected.size > 0;

  const openSheet = (t: Transaction) => {
    setOpened(t);
    sheetRef.current?.present();
  };

  const decideMany = (transactions: Transaction[], status: 'mine' | 'ignored', message: string) => {
    transactions.forEach((transaction) => decide.mutate({ transaction, status }));
    setUndo({ message, transactions });
  };

  const handleSwipeMine = (t: Transaction) => {
    if (!t.category) {
      openSheet(t);
      return;
    }
    decideMany([t], 'mine', '내 소비로 옮겼어요');
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedTransactions = days.flatMap((d) => d.items).filter((t) => selected.has(t.id));

  const handleBulk = (status: 'mine' | 'ignored') => {
    decideMany(selectedTransactions, status, `${selectedTransactions.length}건 정리했어요`);
    setSelected(new Set());
  };

  const handleUndo = () => {
    undo?.transactions.forEach((transaction) => decide.mutate({ transaction, status: 'pending' }));
    setUndo(null);
  };
  const hideUndo = useCallback(() => setUndo(null), []);

  // 열린 시트는 목록이 새로 고쳐지면 최신 값을 보여준다
  const openedLatest = opened ? (days.flatMap((d) => d.items).find((t) => t.id === opened.id) ?? opened) : null;

  return (
    <ScreenLayout>
      <CaptureBanner />
      {selectionMode ? (
        <SelectionBar count={selected.size} onMine={() => handleBulk('mine')} onIgnore={() => handleBulk('ignored')} onCancel={() => setSelected(new Set())} />
      ) : (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[FONT.title, { color: colors.textPrimary }]}>정리</Text>
            <Text style={[FONT.caption, { color: colors.textSecondary }]}>{formatDayKey(todayKstDayKey())}</Text>
          </View>
          {count > 0 ? (
            <Text style={[FONT.caption, { color: colors.textSecondary }]}>{`정리할 소비 ${count}건 · 합계 ${formatWon(total)}`}</Text>
          ) : null}
        </View>
      )}

      <SectionList
        sections={days.map((d) => ({ ...d, data: d.items }))}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); refreshOrganize(); }} />}
        renderSectionHeader={({ section }) => <DayHeader label={section.label} count={section.items.length} total={section.total} />}
        renderItem={({ item }) => (
          <SwipeableTransactionRow
            transaction={item}
            selectionMode={selectionMode}
            selected={selected.has(item.id)}
            onSwipeMine={() => handleSwipeMine(item)}
            onSwipeIgnore={() => decideMany([item], 'ignored', '무시했어요')}
            onPress={() => (selectionMode ? toggleSelected(item.id) : openSheet(item))}
            onLongPress={() => toggleSelected(item.id)}
          />
        )}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        ListFooterComponent={<OrganizeStatusBar state={organizeState} onRun={runNow} />}
        contentContainerStyle={styles.listContent}
      />

      <UndoSnackbar message={undo?.message ?? null} onUndo={handleUndo} onHide={hideUndo} />
      <TransactionSheet ref={sheetRef} transaction={openedLatest} onDismiss={() => setOpened(null)} />
    </ScreenLayout>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[FONT.title, { color: colors.textPrimary }]}>오늘은 다 정리했어요</Text>
      <Text style={[FONT.body, { color: colors.textSecondary }]}>새 결제 알림이 오면 여기에 모여요.</Text>
      <Pressable onPress={() => router.push('/setup/hidden')} hitSlop={SPACE.sm}>
        <Text style={[FONT.caption, { color: colors.accent }]}>숨긴 건 보기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.sm, gap: SPACE.xs },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  listContent: { flexGrow: 1, paddingBottom: 80 },
  empty: { alignItems: 'center', gap: SPACE.sm, paddingTop: 96, paddingHorizontal: SPACE.xl },
});
