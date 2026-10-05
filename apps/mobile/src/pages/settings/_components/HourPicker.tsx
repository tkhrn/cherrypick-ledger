import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/components/atoms/Chip';
import { SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

export function HourPicker({ value, onChange }: { value: string; onChange: (hour: string) => void }) {
  const { status } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {HOURS.map((h) => (
        <Chip key={h} label={h} selected={value.startsWith(h)} tone={status.group} onPress={() => onChange(h)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: SPACE.sm } });
