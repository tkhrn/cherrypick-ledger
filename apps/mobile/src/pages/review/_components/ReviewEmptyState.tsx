import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ReviewEmptyStateProps {
  autoHiddenCount: number;
  onPressHidden: () => void;
  children?: ReactNode;
}

/** 정리할 건이 없을 때. 자동으로 숨긴 건이 있으면 바로 볼 수 있게 한다 */
export function ReviewEmptyState({ autoHiddenCount, onPressHidden, children }: ReviewEmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[FONT.title, { color: colors.textPrimary }]}>오늘은 다 정리했어요</Text>
      <Text style={[FONT.body, { color: colors.textSecondary }]}>새 결제 알림이 오면 여기에 모여요.</Text>
      {autoHiddenCount > 0 ? (
        <Pressable onPress={onPressHidden} hitSlop={SPACE.sm} accessibilityRole="link">
          <Text style={[FONT.caption, { color: colors.accent }]}>{`자동으로 숨긴 건 ${autoHiddenCount}개 보기`}</Text>
        </Pressable>
      ) : null}
      {children ? <View style={styles.extra}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: SPACE.sm, paddingTop: 96, paddingHorizontal: SPACE.xl },
  extra: { alignSelf: 'stretch', marginTop: SPACE.xl },
});
