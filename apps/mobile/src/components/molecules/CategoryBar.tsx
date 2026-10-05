import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryShare } from '@/utils/calendar';
import { formatWon } from '@/utils/won';

const BAR_HEIGHT = 8;
const DOT_SIZE = 8;

interface CategoryBarProps {
  shares: CategoryShare[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

/** 카테고리 비율 막대. 탭하면 카테고리별 금액이 펼쳐지고, 항목을 누르면 그 카테고리로 거른다 */
export function CategoryBar({ shares, selectedKey, onSelect }: CategoryBarProps) {
  const { colors, categories } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  if (shares.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel="카테고리별 금액 보기" onPress={() => setIsExpanded((v) => !v)} style={styles.bar}>
        {shares.map((s) => (
          <View key={s.key} style={{ flex: s.ratio, backgroundColor: categories[s.colorToken].bar, opacity: selectedKey && selectedKey !== s.key ? 0.3 : 1 }} />
        ))}
      </Pressable>
      {isExpanded
        ? shares.map((s) => (
            <Pressable key={s.key} onPress={() => onSelect(selectedKey === s.key ? null : s.key)} style={styles.item}>
              <View style={[styles.dot, { backgroundColor: categories[s.colorToken].bar }]} />
              <Text style={[FONT.body, styles.grow, { color: selectedKey === s.key ? colors.accent : colors.textPrimary }]}>{s.name}</Text>
              <Text style={[FONT.amount, { color: colors.textPrimary }]}>{formatWon(s.amount)}</Text>
              <Text style={[FONT.caption, styles.ratio, { color: colors.textMuted }]}>{`${Math.round(s.ratio * 100)}%`}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, gap: SPACE.xs },
  bar: { height: BAR_HEIGHT, borderRadius: RADIUS.sm, overflow: 'hidden', flexDirection: 'row' },
  item: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingVertical: SPACE.xs },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  grow: { flex: 1 },
  ratio: { width: 36, textAlign: 'right' },
});
