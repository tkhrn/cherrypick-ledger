import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { OrganizeStatusBar } from '@/components/molecules/OrganizeStatusBar';
import { CaptureBanner } from '@/components/organisms/CaptureBanner';
import { HistoryImportCard } from '@/components/organisms/HistoryImportCard';
import { SwipeableTransactionRow } from '@/components/organisms/SwipeableTransactionRow';
import { TransactionSheet } from '@/components/organisms/TransactionSheet';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import type { DecisionStatus, Transaction } from '@/types/transaction';
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
  // mutateAsync만 꺼낸다: decide 객체는 렌더마다 새로 만들어져 행 핸들러가 매번 바뀐다
  const { mutateAsync: decideAsync } = useTransactionDecision().decide;
  const sheetRef = useRef<BottomSheetModal>(null);
  const [opened, setOpened] = useState<Transaction | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ message: string; transactions: Transaction[] } | null>(null);
  const selectionMode = selected.size > 0;

  const openSheet = (t: Transaction) => {
    setOpened(t);
    setOpeningId(t.id);
    // 시트 내용을 그리는 동안 화면이 멈추므로, 행의 스피너가 먼저 그려지게 한 프레임 미룬다
    requestAnimationFrame(() => sheetRef.current?.present());
  };
  const clearOpening = () => setOpeningId(null);

  // 실패한 건은 목록에 되돌아오므로, 스낵바도 실패 안내로 바꿔 알린다
  const decideAll = async (transactions: Transaction[], status: DecisionStatus) => {
    const results = await Promise.allSettled(transactions.map((transaction) => decideAsync({ transaction, status })));
    if (results.some((r) => r.status === 'rejected')) setUndo({ message: '처리하지 못한 건이 있어요. 다시 시도해 주세요', transactions: [] });
  };

  const decideMany = (transactions: Transaction[], status: 'mine' | 'ignored', message: string) => {
    setUndo({ message, transactions });
    decideAll(transactions, status);
  };

  const handleSwipeMine = (t: Transaction) => {
    if (!t.category) {
      openSheet(t);
      return;
    }
    decideMany([t], 'mine', '내 소비로 옮겼어요');
  };

  const handleSwipeIgnore = (t: Transaction) => decideMany([t], 'ignored', '무시했어요');
  const handlePress = (t: Transaction) => (selectionMode ? toggleSelected(t.id) : openSheet(t));
  const handleLongPress = (t: Transaction) => toggleSelected(t.id);

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
    if (!undo) return;
    setUndo(null);
    decideAll(undo.transactions, 'pending');
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
            isOpening={openingId === item.id}
            onSwipeMine={handleSwipeMine}
            onSwipeIgnore={handleSwipeIgnore}
            onPress={handlePress}
            onLongPress={handleLongPress}
          />
        )}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        ListFooterComponent={<OrganizeStatusBar state={organizeState} onRun={runNow} />}
        contentContainerStyle={styles.listContent}
      />

      <UndoSnackbar message={undo?.message ?? null} onUndo={undo?.transactions.length ? handleUndo : undefined} onHide={hideUndo} />
      <TransactionSheet
        ref={sheetRef}
        transaction={openedLatest}
        onAppear={clearOpening}
        onDismiss={() => {
          setOpened(null);
          clearOpening();
        }}
      />
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
      <View style={styles.importCard}>
        <HistoryImportCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.sm, gap: SPACE.xs },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  listContent: { flexGrow: 1, paddingBottom: 80 },
  empty: { alignItems: 'center', gap: SPACE.sm, paddingTop: 96, paddingHorizontal: SPACE.xl },
  importCard: { alignSelf: 'stretch', marginTop: SPACE.xl },
});
