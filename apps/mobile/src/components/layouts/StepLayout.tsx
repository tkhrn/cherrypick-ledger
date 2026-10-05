import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ScreenLayout } from './ScreenLayout';

interface StepLayoutProps {
  title: string;
  description: string;
  children?: ReactNode;
  footer: ReactNode;
}

export function StepLayout({ title, description, children, footer }: StepLayoutProps) {
  const { colors } = useTheme();
  return (
    <ScreenLayout edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[FONT.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[FONT.body, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.footer}>{footer}</View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.xl, paddingBottom: SPACE.md, gap: SPACE.sm },
  body: { flex: 1 },
  footer: { padding: SPACE.lg, gap: SPACE.sm },
});
