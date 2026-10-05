import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SelectionBarProps {
  count: number;
  onMine: () => void;
  onIgnore: () => void;
  onCancel: () => void;
}

export function SelectionBar({ count, onMine, onIgnore, onCancel }: SelectionBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border }]}>
      <Text style={[FONT.body, styles.grow, { color: colors.textPrimary }]}>{`${count}건 선택`}</Text>
      <Button label="내 소비" onPress={onMine} disabled={count === 0} />
      <Button label="무시" onPress={onIgnore} disabled={count === 0} />
      <Button label="취소" variant="ghost" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  grow: { flex: 1 },
});
