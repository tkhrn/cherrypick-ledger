import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { RawNotificationBox } from '@/components/molecules/RawNotificationBox';
import { TransactionRow } from '@/components/molecules/TransactionRow';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useAppLabel } from '@/hooks/useAppLabel';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@/types/transaction';

const MERGE_WINDOW_MS = 60 * 60 * 1000;

/** 원본 알림 목록과 나누기·합치기 */
export function NoticesSection({ transaction, onRegrouped }: { transaction: Transaction; onRegrouped: () => void }) {
  const { colors, status } = useTheme();
  const appLabel = useAppLabel();
  const { split, merge } = useTransactionDecision();
  const { transactions: pending } = useTransactions({ status: 'pending' });
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const at = Date.parse(transaction.occurredAt);
  const mergeCandidates = pending.filter(
    (p) => p.id !== transaction.id && p.amount === transaction.amount && Math.abs(Date.parse(p.occurredAt) - at) <= MERGE_WINDOW_MS,
  );
  const canSplit = transaction.notices.length > 1;
  const canSubmitSplit = picked.size > 0 && picked.size < transaction.notices.length;

  const togglePicked = (eventId: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

  const handleSplit = () =>
    split.mutate({ transactionId: transaction.id, eventIds: [...picked] }, { onSuccess: () => { setIsSplitting(false); setPicked(new Set()); onRegrouped(); } });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[FONT.caption, { color: colors.textSecondary }]}>{`원본 알림 ${transaction.notices.length}개`}</Text>
        {canSplit ? (
          <Pressable onPress={() => setIsSplitting((v) => !v)} hitSlop={SPACE.sm}>
            <Text style={[FONT.caption, { color: colors.accent }]}>{isSplitting ? '취소' : '나누기'}</Text>
          </Pressable>
        ) : null}
      </View>
      <RawNotificationBox
        notices={transaction.notices}
        appLabel={appLabel}
        renderLeading={isSplitting ? (n) => (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: picked.has(n.eventId) }} onPress={() => togglePicked(n.eventId)}
            style={[styles.pick, { borderColor: picked.has(n.eventId) ? colors.accent : colors.border, backgroundColor: picked.has(n.eventId) ? colors.accent : 'transparent' }]} />
        ) : undefined}
      />
      {isSplitting ? <Button label="따로 분리" variant="primary" disabled={!canSubmitSplit} isLoading={split.isPending} onPress={handleSplit} /> : null}
      {isSplitting && split.error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>나누지 못했어요. 다시 시도해 주세요</Text> : null}

      {transaction.status === 'pending' && mergeCandidates.length > 0 ? (
        <View style={styles.merge}>
          <Pressable onPress={() => setIsMerging((v) => !v)}>
            <Text style={[FONT.caption, { color: colors.accent }]}>{isMerging ? '합치기 닫기' : `합칠 건 찾기 (${mergeCandidates.length})`}</Text>
          </Pressable>
          {isMerging
            ? mergeCandidates.map((c) => (
                <Pressable key={c.id} disabled={merge.isPending} onPress={() => merge.mutate({ targetId: transaction.id, sourceId: c.id }, { onSuccess: onRegrouped })}>
                  {({ pressed }) => (
                    <TransactionRow
                      merchant={c.merchant} amount={c.amount} kind={c.kind} category={c.category} noticeCount={c.notices.length} needsReview={false} isCancelled={false}
                      highlighted={pressed || (merge.isPending && merge.variables?.sourceId === c.id)}
                    />
                  )}
                </Pressable>
              ))
            : null}
          {merge.error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>합치지 못했어요. 다시 시도해 주세요</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  pick: { width: 18, height: 18, borderRadius: RADIUS.sm, borderWidth: 1.5, marginTop: 1 },
  merge: { gap: SPACE.sm, marginTop: SPACE.sm },
});
