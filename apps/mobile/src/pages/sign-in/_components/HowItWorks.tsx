import { IconBell, IconChecks, IconStack2, type Icon } from '@tabler/icons-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND, FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const STEPS: { icon: Icon; title: string; body: string }[] = [
  { icon: IconBell, title: '결제 알림을 모아요', body: '카드·은행·페이 앱 알림과 결제 문자' },
  { icon: IconStack2, title: '같은 결제는 하나로', body: '여러 앱에서 온 중복 알림을 묶어요' },
  { icon: IconChecks, title: '내 소비만 골라 담아요', body: '내 계좌 이체·총무 지출은 따로' },
];

const STEP_ICON = 36;
const CHERRY_TINT = { light: '#F7E1E4', dark: '#4A1C24' } as const;

export function HowItWorks() {
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.list}>
      {STEPS.map(({ icon: Glyph, title, body }) => (
        <View key={title} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: CHERRY_TINT[scheme] }]}>
            <Glyph size={18} color={BRAND.cherry} />
          </View>
          <View style={styles.texts}>
            <Text style={[FONT.body, styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[FONT.caption, { color: colors.textSecondary }]}>{body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACE.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  icon: { width: STEP_ICON, height: STEP_ICON, borderRadius: STEP_ICON / 2, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { fontWeight: '600' },
});
