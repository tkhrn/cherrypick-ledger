import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface AsyncBoundaryProps {
  children: ReactNode;
  errorFallback?: (props: FallbackProps) => ReactNode;
  loadingFallback?: ReactNode;
  resetKeys?: unknown[];
}

function DefaultErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="alert" style={styles.center}>
      <Text style={[FONT.body, { color: colors.textSecondary }]}>불러오지 못했어요.</Text>
      <Pressable onPress={resetErrorBoundary} style={[styles.retry, { borderColor: colors.border }]}>
        <Text style={[FONT.body, { color: colors.accent }]}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

function DefaultLoadingFallback() {
  return (
    <View style={styles.center} accessibilityLabel="불러오는 중">
      <ActivityIndicator />
    </View>
  );
}

export function AsyncBoundary({ children, errorFallback, loadingFallback = <DefaultLoadingFallback />, resetKeys = [] }: AsyncBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={resetKeys}
          FallbackComponent={errorFallback ? (props) => <>{errorFallback(props)}</> : DefaultErrorFallback}
        >
          <Suspense fallback={loadingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xl, gap: SPACE.md },
  retry: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm },
});
