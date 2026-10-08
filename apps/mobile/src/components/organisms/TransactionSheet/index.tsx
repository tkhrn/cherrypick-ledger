import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, useBottomSheetModal, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { IconPencil } from '@tabler/icons-react-native';
import { BackHandler, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { Button } from '@/components/atoms/Button';
import { SheetTextField } from '@/components/molecules/SheetTextField';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import type { ReviewReason, Transaction } from '@/types/transaction';
import { dayLabel, kstDayKey, kstTime, todayKstDayKey } from '@/utils/kstDate';
import { formatWon } from '@/utils/won';
import { DecisionSection } from './DecisionSection';
import { canSave, initialDraft, type SheetDraft } from './draft';
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
  /** 시트가 화면에 올라오기 시작할 때 (열기 대기 표시를 끄는 시점) */
  onAppear?: () => void;
}

export const TransactionSheet = forwardRef<BottomSheetModal, TransactionSheetProps>(function TransactionSheet({ transaction, onDismiss, onAppear }, ref) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);
  useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal);

  // 안드로이드 뒤로 가기는 앱을 나가지 않고 시트를 닫는다
  useEffect(() => {
    if (!isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      sheetRef.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      onChange={(index) => setIsOpen(index >= 0)}
      onAnimate={(fromIndex, toIndex) => {
        if (fromIndex < 0 && toIndex >= 0) onAppear?.();
      }}
      onDismiss={() => {
        setIsOpen(false);
        onDismiss();
      }}
      maxDynamicContentSize={height * MAX_SHEET_HEIGHT_RATIO}
      backgroundStyle={{ backgroundColor: colors.bgSurface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={(props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {transaction ? <SheetContent key={transaction.id} transaction={transaction} onRegrouped={onDismiss} /> : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function SheetContent({ transaction: t, onRegrouped }: { transaction: Transaction; onRegrouped: () => void }) {
  const { colors, status } = useTheme();
  const { dismiss } = useBottomSheetModal();
  const { save } = useTransactionDecision();
  const [start] = useState(() => initialDraft(t));
  const [draft, setDraft] = useState<SheetDraft>(start);
  const [isEditingName, setIsEditingName] = useState(false);
  const isCancelled = t.cancelledAt !== null;
  const change = (patch: Partial<SheetDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const submit = (next: SheetDraft) =>
    save.mutate(
      { transaction: t, status: next.status, categoryId: next.categoryId, groupId: next.groupId, memo: next.memo, merchant: next.merchant },
      { onSuccess: () => dismiss() },
    );

  return (
    <View style={styles.inner}>
      <View style={styles.title}>
        {isEditingName ? (
          <View style={styles.grow}>
            <SheetTextField placeholder="가게 이름" autoFocus value={draft.merchant} onChangeText={(merchant) => change({ merchant })} onSubmitEditing={() => setIsEditingName(false)} returnKeyType="done" />
          </View>
        ) : (
          <Pressable style={[styles.grow, styles.nameRow]} accessibilityRole="button" accessibilityHint="가게 이름 고치기" onPress={() => setIsEditingName(true)} hitSlop={SPACE.sm}>
            <Text style={[FONT.title, styles.shrink, { color: draft.merchant ? colors.textPrimary : colors.textSecondary }]} numberOfLines={2}>
              {draft.merchant || '가게 이름 없음'}
            </Text>
            <IconPencil size={18} color={colors.textMuted} />
          </Pressable>
        )}
        <Text style={[FONT.amountLarge, { color: isCancelled ? colors.textMuted : colors.textPrimary, textDecorationLine: isCancelled ? 'line-through' : 'none' }]}>
          {formatWon(t.amount)}
        </Text>
      </View>
      <Text style={[FONT.caption, { color: colors.textSecondary }]}>
        {`${dayLabel(kstDayKey(t.occurredAt), todayKstDayKey())} ${kstTime(t.occurredAt)}${t.category ? ` · ${t.category.name}` : ''}`}
      </Text>
      {isCancelled ? <StatusBadge tone="cancelled" label="승인취소됨" /> : null}
      {t.status === 'pending' && t.needsReview && t.reviewReason ? <StatusBadge tone="review" label={REVIEW_REASON_TEXT[t.reviewReason]} /> : null}

      <DecisionSection draft={draft} onChange={change} onIgnore={() => submit({ ...draft, status: 'ignored' })} />
      <SheetTextField placeholder="메모" value={draft.memo} onChangeText={(memo) => change({ memo })} />
      <Button label="저장" variant="primary" disabled={!canSave(draft, start)} isLoading={save.isPending} onPress={() => submit(draft)} />
      {save.error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>저장하지 못했어요. 다시 시도해 주세요</Text> : null}
      <NoticesSection transaction={t} onRegrouped={onRegrouped} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACE.xl },
  inner: { padding: SPACE.lg, gap: SPACE.md },
  title: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  grow: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  shrink: { flexShrink: 1 },
});
