import { router } from 'expo-router';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';
import { sumByDay } from '@/utils/calendar';
import { dayLabel, kstDayKey, todayKstDayKey } from '@/utils/kstDate';
import { formatWon } from '@/utils/won';
import { MonthCalendar } from './MonthCalendar';
import { TransactionRow } from './TransactionRow';

interface LedgerBodyProps {
  transactions: Transaction[];
  year: number;
  month: number;
  viewMode: 'list' | 'calendar';
  pendingDays: ReadonlySet<string>;
  selectedDay: string | null;
  onSelectDay: (dayKey: string) => void;
  subtitleOf?: (t: Transaction) => string | undefined;
  onPressTransaction: (t: Transaction) => void;
  emptyTitle: string;
  emptyBody: string;
  header?: React.ReactNode;
}

/** 월 단위 결정 기록을 목록 또는 달력으로 보여준다 */
export function LedgerBody(props: LedgerBodyProps) {
  const { transactions, year, month, viewMode, pendingDays, selectedDay, onSelectDay, subtitleOf, onPressTransaction, emptyTitle, emptyBody, header } = props;
  const { colors } = useTheme();
  const todayKey = todayKstDayKey();

  const renderRow = (t: Transaction) => (
    <Pressable key={t.id} onPress={() => onPressTransaction(t)}>
      <TransactionRow merchant={t.merchant} amount={t.amount} kind={t.kind} category={t.category} noticeCount={0} needsReview={false} isCancelled={t.cancelledAt !== null} subtitle={subtitleOf?.(t)} />
    </Pressable>
  );

  const empty = (
    <View style={styles.empty}>
      <Text style={[FONT.body, { color: colors.textPrimary }]}>{emptyTitle}</Text>
      <Text style={[FONT.caption, { color: colors.textSecondary }]}>{emptyBody}</Text>
    </View>
  );

  if (viewMode === 'calendar') {
    const dayItems = selectedDay ? transactions.filter((t) => kstDayKey(t.occurredAt) === selectedDay) : [];
    return (
      <ScrollView>
        {header}
        <MonthCalendar year={year} month={month} sums={sumByDay(transactions)} pendingDays={pendingDays} todayKey={todayKey} selectedDay={selectedDay} onSelectDay={onSelectDay} />
        {selectedDay ? (
          <View style={styles.dayList}>
            <View style={styles.dayHeader}>
              <Text style={[FONT.caption, { color: colors.textSecondary }]}>{dayLabel(selectedDay, todayKey)}</Text>
              {pendingDays.has(selectedDay) ? (
                <Pressable onPress={() => router.navigate('/')} hitSlop={SPACE.sm}>
                  <Text style={[FONT.caption, { color: colors.accent }]}>정리하러 가기</Text>
                </Pressable>
              ) : null}
            </View>
            {dayItems.length > 0 ? dayItems.map(renderRow) : <Text style={[FONT.caption, styles.none, { color: colors.textMuted }]}>기록이 없어요</Text>}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  const byDay = new Map<string, Transaction[]>();
  for (const t of transactions) byDay.set(kstDayKey(t.occurredAt), [...(byDay.get(kstDayKey(t.occurredAt)) ?? []), t]);
  const sections = [...byDay].map(([dayKey, data]) => ({ dayKey, data, total: sumByDay(data).get(dayKey) ?? 0 }));

  return (
    <SectionList
      ListHeaderComponent={<>{header}</>}
      sections={sections}
      keyExtractor={(t) => t.id}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <View style={[styles.dayHeader, { backgroundColor: colors.bgPage }]}>
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>{dayLabel(section.dayKey, todayKey)}</Text>
          <Text style={[FONT.caption, { color: colors.textMuted }]}>{formatWon(section.total)}</Text>
        </View>
      )}
      renderItem={({ item }) => renderRow(item)}
      ListEmptyComponent={empty}
    />
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: SPACE.xs, paddingTop: 64, paddingHorizontal: SPACE.xl },
  dayList: { paddingTop: SPACE.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm },
  none: { paddingHorizontal: SPACE.lg },
});
