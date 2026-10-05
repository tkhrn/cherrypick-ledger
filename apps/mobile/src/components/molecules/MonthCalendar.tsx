import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { buildMonthGrid } from '@/utils/calendar';

const WEEKDAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const PENDING_DOT_SIZE = 5;
const amountFormatter = new Intl.NumberFormat('ko-KR');

interface MonthCalendarProps {
  year: number;
  month: number;
  sums: Map<string, number>;
  pendingDays: ReadonlySet<string>;
  todayKey: string;
  selectedDay: string | null;
  onSelectDay: (dayKey: string) => void;
}

export function MonthCalendar({ year, month, sums, pendingDays, todayKey, selectedDay, onSelectDay }: MonthCalendarProps) {
  const { colors, status } = useTheme();
  const cells = buildMonthGrid(year, month);

  return (
    <View style={styles.wrap}>
      <View style={styles.week}>
        {WEEKDAY_HEADERS.map((w, i) => (
          <Text key={w} style={[FONT.caption, styles.weekday, { color: i === 0 ? status.cancelled.fg : colors.textSecondary }]}>{w}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((dayKey, index) => {
          if (!dayKey) return <View key={`empty-${index}`} style={styles.cell} />;
          const day = Number(dayKey.slice(-2));
          const sum = sums.get(dayKey);
          const hasPending = pendingDays.has(dayKey);
          const isToday = dayKey === todayKey;
          const isFuture = dayKey > todayKey;
          const isSelected = dayKey === selectedDay;
          const dayText = sum ? `${month}월 ${day}일 ${amountFormatter.format(sum)}원` : `${month}월 ${day}일`;
          const label = hasPending ? `${dayText}, 정리할 건 있음` : dayText;
          return (
            <Pressable
              key={dayKey}
              accessibilityLabel={label}
              disabled={isFuture}
              onPress={() => onSelectDay(dayKey)}
              style={[
                styles.cell,
                styles.day,
                isToday && { backgroundColor: colors.accentTint },
                isSelected && { borderWidth: 2, borderColor: colors.accent },
              ]}
            >
              <Text style={[FONT.caption, { color: isFuture ? colors.textMuted : isToday ? colors.accent : colors.textPrimary }]}>{day}</Text>
              {sum ? <Text style={[FONT.micro, { color: colors.textSecondary }]} numberOfLines={1}>{amountFormatter.format(sum)}</Text> : null}
              {hasPending ? <View style={[styles.dot, { backgroundColor: status.review.fg }]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.sm },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingVertical: SPACE.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1 / 1.15, padding: 2 },
  day: { alignItems: 'center', borderRadius: RADIUS.sm, paddingTop: SPACE.xs },
  dot: { width: PENDING_DOT_SIZE, height: PENDING_DOT_SIZE, borderRadius: PENDING_DOT_SIZE / 2, marginTop: 2 },
});
