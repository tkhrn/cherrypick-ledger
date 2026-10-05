import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { SourceNotice } from '@/types/transaction';
import { kstTime } from '@/utils/kstDate';

interface RawNotificationBoxProps {
  notices: SourceNotice[];
  appLabel: (sourcePackage: string) => string;
  renderLeading?: (notice: SourceNotice) => React.ReactNode;
}

export function RawNotificationBox({ notices, appLabel, renderLeading }: RawNotificationBoxProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.bgSubtle }]}>
      {notices.map((notice) => (
        <View key={notice.eventId} style={styles.item}>
          {renderLeading?.(notice)}
          <Text style={[FONT.mono, styles.text, { color: colors.textSecondary }]}>
            {`[${appLabel(notice.sourcePackage)}] ${[notice.title, notice.body].filter(Boolean).join(' ')} · ${kstTime(notice.postedAt)}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.sm, padding: SPACE.sm, gap: SPACE.sm },
  item: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  text: { flex: 1, lineHeight: 18 },
});
