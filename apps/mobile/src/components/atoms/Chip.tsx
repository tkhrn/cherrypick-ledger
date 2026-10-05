import { Pressable, StyleSheet, Text } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  tone?: { bg: string; fg: string };
  dashed?: boolean;
  onPress: () => void;
}

const CHIP_HEIGHT = 30;

export function Chip({ label, selected = false, tone, dashed = false, onPress }: ChipProps) {
  const { colors } = useTheme();
  const active = selected && tone;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? tone.bg : colors.border, backgroundColor: active ? tone.bg : 'transparent', borderStyle: dashed ? 'dashed' : 'solid' },
      ]}
    >
      <Text style={[FONT.caption, { color: active ? tone.fg : dashed ? colors.textSecondary : colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: CHIP_HEIGHT, paddingHorizontal: SPACE.md, borderRadius: RADIUS.pill, borderWidth: 1, justifyContent: 'center' },
});
