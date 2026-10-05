import { StyleSheet, Text, View } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatWon } from '@/utils/won';

export function DayHeader({ label, count, total }: { label: string; count: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.bgPage }]}>
      <Text style={[FONT.caption, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[FONT.caption, { color: colors.textMuted }]}>{`${count}건 · ${formatWon(total)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm },
});
