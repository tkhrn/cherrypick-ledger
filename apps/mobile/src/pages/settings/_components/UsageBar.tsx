import { StyleSheet, View } from 'react-native';
import { RADIUS } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BAR_HEIGHT = 6;

export function UsageBar({ ratio }: { ratio: number }) {
  const { colors, status } = useTheme();
  const clamped = Math.min(1, Math.max(0, ratio));
  return (
    <View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
      <View style={{ flex: clamped, backgroundColor: clamped >= 1 ? status.review.fg : colors.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { height: BAR_HEIGHT, borderRadius: RADIUS.sm, overflow: 'hidden', flexDirection: 'row' } });
