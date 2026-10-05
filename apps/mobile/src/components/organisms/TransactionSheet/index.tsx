import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { forwardRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TextField } from '@/components/atoms/TextField';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import type { ReviewReason, Transaction } from '@/types/transaction';
import { dayLabel, kstDayKey, kstTime, todayKstDayKey } from '@/utils/kstDate';
import { formatWon } from '@/utils/won';
import { DecisionSection } from './DecisionSection';
import { NoticesSection } from './NoticesSection';

const REVIEW_REASON_TEXT: Record<ReviewReason, string> = {
  ambiguous_group: '같은 금액 결제가 근처에 있어 묶음이 확실하지 않아요',
  missing_merchant: '알림에서 가게 이름을 찾지 못했어요',
  unmatched_cancel: '취소된 원래 결제를 찾지 못했어요',
  parse_failed: '알림을 해석하지 못했어요. 원본 알림을 확인해 주세요',
};

const MAX_SHEET_HEIGHT_RATIO = 0.9;

interface TransactionSheetProps {
  transaction: Transaction | null;
  onDismiss: () => void;
}

export const TransactionSheet = forwardRef<BottomSheetModal, TransactionSheetProps>(function TransactionSheet({ transaction, onDismiss }, ref) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onDismiss}
      maxDynamicContentSize={height * MAX_SHEET_HEIGHT_RATIO}
      backgroundStyle={{ backgroundColor: colors.bgSurface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={(props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {transaction ? <SheetContent key={transaction.id} transaction={transaction} onRegrouped={onDismiss} /> : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function SheetContent({ transaction: t, onRegrouped }: { transaction: Transaction; onRegrouped: () => void }) {
  const { colors } = useTheme();
  const { decide } = useTransactionDecision();
  const [memo, setMemo] = useState(t.memo ?? '');
  const isCancelled = t.cancelledAt !== null;

  const handleMemoBlur = () => {
    if ((t.memo ?? '') === memo || t.status === 'auto_hidden') return;
    decide.mutate({ transaction: t, status: t.status, memo });
  };

  return (
    <View style={styles.inner}>
      <View style={styles.title}>
        <Text style={[FONT.title, styles.grow, { color: colors.textPrimary }]} numberOfLines={2}>{t.merchant ?? '가게 이름 없음'}</Text>
        <Text style={[FONT.amountLarge, { color: isCancelled ? colors.textMuted : colors.textPrimary, textDecorationLine: isCancelled ? 'line-through' : 'none' }]}>
          {formatWon(t.amount)}
        </Text>
      </View>
      <Text style={[FONT.caption, { color: colors.textSecondary }]}>
        {`${dayLabel(kstDayKey(t.occurredAt), todayKstDayKey())} ${kstTime(t.occurredAt)}${t.category ? ` · ${t.category.name}` : ''}`}
      </Text>
      {isCancelled ? <StatusBadge tone="cancelled" label="승인취소됨" /> : null}
      {t.needsReview && t.reviewReason ? <StatusBadge tone="review" label={REVIEW_REASON_TEXT[t.reviewReason]} /> : null}

      <DecisionSection transaction={t} />
      <TextField placeholder="메모" value={memo} onChangeText={setMemo} onBlur={handleMemoBlur} />
      <NoticesSection transaction={t} onRegrouped={onRegrouped} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACE.xl },
  inner: { padding: SPACE.lg, gap: SPACE.md },
  title: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  grow: { flex: 1 },
});
