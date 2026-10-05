import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button } from '@/components/atoms/Button';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useUserSettings } from '@/hooks/useUserSettings';
import { QueryProvider } from '@/providers/QueryProvider';
import { SessionProvider, useSession } from '@/providers/SessionProvider';
import { entryRoute } from '@/utils/entryRoute';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading: isSessionLoading } = useSession();
  const isSignedIn = session !== null;
  const { settings, status, refetch } = useUserSettings({ enabled: isSignedIn });
  const route = entryRoute({
    isSessionLoading,
    isSignedIn,
    settings: status === 'success' ? { status, onboardedAt: settings?.onboarded_at ?? null } : { status },
  });

  useEffect(() => {
    if (route !== 'loading') SplashScreen.hideAsync();
  }, [route]);

  if (route === 'loading') return null;
  if (route === 'error') return <LoadFailed onRetry={() => refetch()} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={route === 'sign-in'}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'onboarding'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'app'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="setup" />
      </Stack.Protected>
    </Stack>
  );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.bgPage }]}>
      <Text style={[FONT.body, { color: colors.textPrimary }]}>정보를 불러오지 못했어요</Text>
      <Text style={[FONT.caption, { color: colors.textSecondary }]}>네트워크를 확인하고 다시 시도해 주세요.</Text>
      <Button label="다시 시도" variant="primary" onPress={onRetry} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <QueryProvider>
        <SessionProvider>
          <BottomSheetModalProvider>
            <RootNavigator />
          </BottomSheetModalProvider>
        </SessionProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.md, padding: SPACE.xl },
});
