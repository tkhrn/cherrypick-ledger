import { IconCheck, IconEyeOff } from '@tabler/icons-react-native';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { TransactionRow } from '@/components/molecules/TransactionRow';
import { ICON_CIRCLE, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';

interface SwipeableTransactionRowProps {
  transaction: Transaction;
  selectionMode: boolean;
  selected: boolean;
  /** 이 행의 상세 시트가 뜨는 중. 시트가 올라오기 시작할 때까지 스피너를 보여준다 */
  isOpening: boolean;
  onSwipeMine: () => void;
  onSwipeIgnore: () => void;
  onPress: () => void;
  onLongPress: () => void;
}

const SWIPE_THRESHOLD = 0.35;
const ROW_WIDTH_ESTIMATE = 360;

export function SwipeableTransactionRow({ transaction: t, selectionMode, selected, isOpening, onSwipeMine, onSwipeIgnore, onPress, onLongPress }: SwipeableTransactionRowProps) {
  const { colors, status } = useTheme();

  const handleOpen = (direction: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'left') onSwipeMine();
    else onSwipeIgnore();
  };

  const checkbox = (
    <View style={[styles.checkbox, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : 'transparent' }]}>
      {selected ? <IconCheck size={16} color={colors.onAccent} /> : null}
    </View>
  );

  const spinner = (
    <View style={styles.spinner}>
      <ActivityIndicator size="small" color={colors.textSecondary} />
    </View>
  );
  const categoryIcon = t.category ? <CategoryIcon icon={t.category.icon} colorToken={t.category.colorToken} /> : undefined;
  const leading = isOpening ? spinner : selectionMode ? checkbox : categoryIcon;

  const row = (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isOpening}
      accessibilityRole="button"
      accessibilityState={{ busy: isOpening, selected: selectionMode ? selected : undefined }}
      accessibilityHint="밀어서 내 소비 또는 무시로 처리"
    >
      {({ pressed }) => (
        <TransactionRow
          merchant={t.merchant}
          amount={t.amount}
          kind={t.kind}
          category={t.category}
          noticeCount={t.notices.length}
          needsReview={t.needsReview}
          isCancelled={t.cancelledAt !== null}
          highlighted={pressed || isOpening}
          leading={leading}
        />
      )}
    </Pressable>
  );

  if (selectionMode) return row;

  return (
    <ReanimatedSwipeable
      leftThreshold={ROW_WIDTH_ESTIMATE * SWIPE_THRESHOLD}
      rightThreshold={ROW_WIDTH_ESTIMATE * SWIPE_THRESHOLD}
      onSwipeableOpen={handleOpen}
      renderLeftActions={() => (
        <View style={[styles.action, styles.left, { backgroundColor: status.mine.bg }]}>
          <IconCheck size={22} color={status.mine.fg} />
        </View>
      )}
      renderRightActions={() => (
        <View style={[styles.action, styles.right, { backgroundColor: status.ignored.bg }]}>
          <IconEyeOff size={22} color={status.ignored.fg} />
        </View>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACE.xl },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  spinner: { width: ICON_CIRCLE, height: ICON_CIRCLE, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 22, height: 22, margin: 5, borderRadius: RADIUS.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
