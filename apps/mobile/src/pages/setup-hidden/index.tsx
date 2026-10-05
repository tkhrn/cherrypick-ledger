import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TransactionRow } from '@/components/molecules/TransactionRow';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types/transaction';

const HIDDEN_LABEL: Record<string, string> = { own_transfer: '내 계좌 이체', deposit: '입금' };

const reasonOf = (t: Transaction) => (t.status === 'ignored' ? '무시' : (HIDDEN_LABEL[t.autoHiddenReason ?? ''] ?? '자동숨김'));

export default function SetupHiddenPage() {
  const { colors } = useTheme();
  const { transactions } = useTransactions({ status: 'hidden' });
  const { decide } = useTransactionDecision();

  return (
    <FlatList
      style={{ backgroundColor: colors.bgPage }}
      data={transactions}
      keyExtractor={(t) => t.id}
      ListEmptyComponent={<Text style={[FONT.caption, styles.empty, { color: colors.textSecondary }]}>숨긴 건이 없어요.</Text>}
      renderItem={({ item }) => (
        <View>
          <TransactionRow merchant={item.merchant} amount={item.amount} kind={item.kind} category={item.category} noticeCount={item.notices.length} needsReview={false} isCancelled={item.cancelledAt !== null} subtitle={reasonOf(item)} />
          <View style={[styles.actions, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border }]}>
            <StatusBadge tone="ignored" label={reasonOf(item)} />
            <Pressable onPress={() => decide.mutate({ transaction: item, status: 'pending' })} hitSlop={SPACE.sm}>
              <Text style={[FONT.caption, { color: colors.accent }]}>정리 목록으로 되돌리기</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { padding: SPACE.xl, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE.lg, paddingBottom: SPACE.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});
