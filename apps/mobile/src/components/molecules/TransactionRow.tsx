import { StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { FONT, ROW_HEIGHT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Category, TransactionKind } from '@/types/transaction';
import { formatWon } from '@/utils/won';

interface TransactionRowProps {
  merchant: string | null;
  amount: number | null;
  kind: TransactionKind;
  category: Category | null;
  noticeCount: number;
  needsReview: boolean;
  isCancelled: boolean;
  subtitle?: string;
  leading?: React.ReactNode;
}

const FALLBACK_ICON: Record<TransactionKind, string> = {
  payment: 'dots',
  transfer_out: 'arrows-exchange',
  deposit: 'arrow-down-left',
  cancel: 'help',
  unknown: 'help',
};

export function TransactionRow({ merchant, amount, kind, category, noticeCount, needsReview, isCancelled, subtitle, leading }: TransactionRowProps) {
  const { colors, categories } = useTheme();
  const detail = [subtitle ?? category?.name, noticeCount > 1 ? `알림 ${noticeCount}개` : null].filter(Boolean).join(' · ');
  return (
    <View style={[styles.row, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border }]}>
      {leading ?? <CategoryIcon icon={category?.icon ?? FALLBACK_ICON[kind]} colorToken={category?.colorToken ?? 'cat-gray'} />}
      <View style={styles.texts}>
        <Text style={[FONT.body, { color: merchant ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
          {merchant ?? '가게 이름 없음'}
        </Text>
        {needsReview ? <StatusBadge tone="review" label="확인 필요" /> : null}
        {!needsReview && detail ? (
          <Text style={[FONT.caption, { color: category ? categories[category.colorToken].fg : colors.textSecondary }]} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Text style={[FONT.amount, { color: isCancelled ? colors.textMuted : colors.textPrimary, textDecorationLine: isCancelled ? 'line-through' : 'none' }]}>
        {formatWon(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  texts: { flex: 1, gap: 2 },
});
