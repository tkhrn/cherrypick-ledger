import { IconClock } from '@tabler/icons-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { OrganizeState } from '@/types/organize';

interface OrganizeStatusBarProps {
  state: OrganizeState;
  onRun: () => void;
}

export function OrganizeStatusBar({ state, onRun }: OrganizeStatusBarProps) {
  const { colors } = useTheme();
  if (state.type === 'idle' && state.unprocessedCount === 0) return null;

  return (
    <View style={[styles.bar, { backgroundColor: colors.bgSubtle }]}>
      {state.type === 'running' ? <ActivityIndicator /> : <IconClock size={16} color={colors.textSecondary} />}
      <View style={styles.texts}>
        {state.type === 'idle' ? (
          <>
            <Text style={[FONT.caption, { color: colors.textSecondary }]}>{`아직 정리 안 된 알림 ${state.unprocessedCount}건`}</Text>
            <Text style={[FONT.caption, { color: colors.textMuted }]}>{`다음 자동 정리 ${state.nextRunLabel}`}</Text>
          </>
        ) : (
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>{state.type === 'running' ? '정리 중…' : '정리하지 못했어요'}</Text>
        )}
      </View>
      {state.type === 'idle' ? <Button label="지금 정리하기" onPress={onRun} /> : null}
      {state.type === 'failed' ? <Button label="다시 시도" onPress={onRun} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, margin: SPACE.md, padding: SPACE.md, borderRadius: RADIUS.md },
  texts: { flex: 1 },
});
