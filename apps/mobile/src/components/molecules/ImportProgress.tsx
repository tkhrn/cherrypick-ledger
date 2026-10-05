import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import type { HistoryImportPhase } from '@/hooks/useHistoryImport';
import { useTheme } from '@/hooks/useTheme';

type RunningPhase = Exclude<HistoryImportPhase, 'idle'>;

const STEPS: Record<RunningPhase, { order: number; title: string; description: string }> = {
  reading: { order: 1, title: '결제 문자 찾는 중', description: '문자함에서 카드·은행 문자만 골라내고 있어요.' },
  uploading: { order: 2, title: '서버로 올리는 중', description: '가져온 문자와 알림을 올리고 있어요.' },
  organizing: { order: 3, title: '정리하는 중', description: '결제 내역으로 묶고 분류하고 있어요. 건수가 많으면 조금 걸릴 수 있어요.' },
};
const STEP_COUNT = Object.keys(STEPS).length;

/** 가져오기 진행 단계를 스피너와 설명으로 보여준다 */
export function ImportProgress({ phase }: { phase: RunningPhase }) {
  const { colors } = useTheme();
  const step = STEPS[phase];
  return (
    <View style={[styles.box, { backgroundColor: colors.bgSubtle }]} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.accent} />
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text style={[FONT.caption, styles.title, { color: colors.textPrimary }]}>{step.title}</Text>
          <Text style={[FONT.caption, { color: colors.textMuted }]}>{`${step.order}/${STEP_COUNT}`}</Text>
        </View>
        <Text style={[FONT.caption, { color: colors.textSecondary }]}>{step.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: SPACE.md, borderRadius: RADIUS.sm },
  texts: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '600' },
});
