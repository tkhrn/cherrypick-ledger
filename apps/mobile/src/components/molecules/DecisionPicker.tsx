import { IconCheck, IconEyeOff, IconNotebook, type Icon } from '@tabler/icons-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE, type StatusTone } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { DecisionStatus } from '@/types/transaction';

const OPTIONS: { value: Exclude<DecisionStatus, 'pending'>; label: string; icon: Icon; tone: StatusTone }[] = [
  { value: 'mine', label: '내 소비', icon: IconCheck, tone: 'mine' },
  { value: 'group', label: '모임장부', icon: IconNotebook, tone: 'group' },
  { value: 'ignored', label: '무시', icon: IconEyeOff, tone: 'ignored' },
];

interface DecisionPickerProps {
  value: DecisionStatus;
  onChange: (value: Exclude<DecisionStatus, 'pending'>) => void;
}

export function DecisionPicker({ value, onChange }: DecisionPickerProps) {
  const { colors, status } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {OPTIONS.map(({ value: option, label, icon: Glyph, tone }) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[
              styles.option,
              selected
                ? { borderWidth: 2, borderColor: status[tone].fg, backgroundColor: status[tone].bg }
                : { borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <Glyph size={20} color={selected ? status[tone].fg : colors.textSecondary} />
            <Text style={[FONT.caption, { color: selected ? status[tone].fg : colors.textPrimary }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACE.sm },
  option: { flex: 1, alignItems: 'center', gap: SPACE.xs, paddingVertical: SPACE.md, borderRadius: RADIUS.md },
});
