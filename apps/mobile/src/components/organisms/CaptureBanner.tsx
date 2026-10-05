import { IconX } from '@tabler/icons-react-native';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useCaptureHealth } from '@/hooks/useCaptureHealth';
import { useTheme } from '@/hooks/useTheme';
import { openNotificationAccessSettings } from '@modules/notification-capture';

const COPY = {
  permission_off: { text: '알림 수집이 꺼져 있어요', action: '권한 켜기', onPress: openNotificationAccessSettings },
  stale: { text: '하루 넘게 새 알림이 없어요. 배터리 최적화를 확인해 주세요', action: '확인하기', onPress: () => Linking.openSettings() },
} as const;

export function CaptureBanner() {
  const { status } = useTheme();
  const { problem, dismiss } = useCaptureHealth();
  if (!problem) return null;
  const copy = COPY[problem];
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: status.review.bg }]}>
      <Text style={[FONT.caption, styles.grow, { color: status.review.fg }]}>{copy.text}</Text>
      <Pressable onPress={copy.onPress} hitSlop={SPACE.sm}>
        <Text style={[FONT.caption, styles.action, { color: status.review.fg }]}>{copy.action}</Text>
      </Pressable>
      <Pressable accessibilityLabel="배너 닫기" onPress={dismiss} hitSlop={SPACE.sm}>
        <IconX size={16} color={status.review.fg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm },
  grow: { flex: 1 },
  action: { fontWeight: '600' },
});
