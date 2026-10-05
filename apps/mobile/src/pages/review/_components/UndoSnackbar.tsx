import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const VISIBLE_MS = 4000;

interface UndoSnackbarProps {
  message: string | null;
  onUndo: () => void;
  onHide: () => void;
}

export function UndoSnackbar({ message, onUndo, onHide }: UndoSnackbarProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.bar, { backgroundColor: colors.textPrimary }]}>
      <Text style={[FONT.body, styles.grow, { color: colors.bgSurface }]}>{message}</Text>
      <Pressable onPress={onUndo} hitSlop={SPACE.sm}>
        <Text style={[FONT.body, styles.action, { color: colors.bgSurface }]}>되돌리기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: SPACE.lg, right: SPACE.lg, bottom: SPACE.lg, flexDirection: 'row', alignItems: 'center', padding: SPACE.md, borderRadius: RADIUS.md },
  grow: { flex: 1 },
  action: { fontWeight: '600' },
});
