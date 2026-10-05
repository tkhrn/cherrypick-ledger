import { IconCheck } from '@tabler/icons-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, ROW_HEIGHT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CheckRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onPress: () => void;
}

const CHECKBOX_SIZE = 22;

export function CheckRow({ label, description, checked, onPress }: CheckRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.box, { borderColor: checked ? colors.accent : colors.border, backgroundColor: checked ? colors.accent : 'transparent' }]}>
        {checked ? <IconCheck size={16} color={colors.onAccent} /> : null}
      </View>
      <View style={styles.texts}>
        <Text style={[FONT.body, { color: colors.textPrimary }]} numberOfLines={1}>{label}</Text>
        {description ? <Text style={[FONT.caption, { color: colors.textMuted }]} numberOfLines={1}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingHorizontal: SPACE.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  box: { width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, borderRadius: RADIUS.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
});
