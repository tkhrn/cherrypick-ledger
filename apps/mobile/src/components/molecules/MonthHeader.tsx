import { IconCalendar, IconChevronLeft, IconChevronRight, IconList } from '@tabler/icons-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatWon } from '@/utils/won';

interface MonthHeaderProps {
  title: string;
  year: number;
  month: number;
  total: number;
  viewMode: 'list' | 'calendar';
  onChangeViewMode: (mode: 'list' | 'calendar') => void;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthHeader({ title, year, month, total, viewMode, onChangeViewMode, onPrev, onNext }: MonthHeaderProps) {
  const { colors } = useTheme();
  const toggleColor = (mode: 'list' | 'calendar') => (viewMode === mode ? colors.textPrimary : colors.textMuted);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[FONT.title, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.toggle}>
          <Pressable accessibilityRole="button" accessibilityLabel="목록 보기" accessibilityState={{ selected: viewMode === 'list' }} onPress={() => onChangeViewMode('list')} hitSlop={SPACE.sm}>
            <IconList size={20} color={toggleColor('list')} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="달력 보기" accessibilityState={{ selected: viewMode === 'calendar' }} onPress={() => onChangeViewMode('calendar')} hitSlop={SPACE.sm}>
            <IconCalendar size={20} color={toggleColor('calendar')} />
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.monthNav}>
          <Pressable accessibilityLabel="이전 달" onPress={onPrev} hitSlop={SPACE.sm}>
            <IconChevronLeft size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={[FONT.body, { color: colors.textSecondary }]}>{`${year}년 ${month}월`}</Text>
          <Pressable accessibilityLabel="다음 달" onPress={onNext} hitSlop={SPACE.sm}>
            <IconChevronRight size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[FONT.amountLarge, { color: colors.textPrimary }]}>{formatWon(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, gap: SPACE.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', gap: SPACE.lg },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
});
