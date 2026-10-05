import { StyleSheet, Text } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[FONT.caption, styles.header, { color: colors.textSecondary, backgroundColor: colors.bgPage }]}>
      {title}
      {trailing ? <Text style={{ color: colors.textMuted }}>{`  ·  ${trailing}`}</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({ header: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm } });
