import { StyleSheet, Text } from 'react-native';
import { FONT, RADIUS, type StatusTone } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  const { status } = useTheme();
  return <Text style={[FONT.caption, styles.badge, { backgroundColor: status[tone].bg, color: status[tone].fg }]}>{label}</Text>;
}

const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 1, borderRadius: RADIUS.pill, overflow: 'hidden' } });
