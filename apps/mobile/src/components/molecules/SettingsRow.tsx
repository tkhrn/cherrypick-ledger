import { IconChevronRight } from '@tabler/icons-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, ROW_HEIGHT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  children?: ReactNode;
}

export function SettingsRow({ label, value, onPress, trailing, children }: SettingsRowProps) {
  const { colors } = useTheme();
  const content = (pressed: boolean) => (
    <View style={[styles.row, { backgroundColor: pressed ? colors.bgSubtle : colors.bgSurface, borderBottomColor: colors.border }]}>
      <View style={styles.line}>
        <Text style={[FONT.body, styles.grow, { color: colors.textPrimary }]}>{label}</Text>
        {value ? <Text style={[FONT.body, { color: colors.textSecondary }]}>{value}</Text> : null}
        {trailing ?? (onPress ? <IconChevronRight size={18} color={colors.textMuted} /> : null)}
      </View>
      {children}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{({ pressed }) => content(pressed)}</Pressable> : content(false);
}

const styles = StyleSheet.create({
  row: { minHeight: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, gap: SPACE.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  grow: { flex: 1 },
});
