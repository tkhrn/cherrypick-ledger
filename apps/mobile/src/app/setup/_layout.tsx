import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function SetupLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSurface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.bgPage },
      }}
    >
      <Stack.Screen name="apps" options={{ title: '분석할 앱' }} />
      <Stack.Screen name="accounts" options={{ title: '내 계좌' }} />
      <Stack.Screen name="categories" options={{ title: '카테고리' }} />
      <Stack.Screen name="groups" options={{ title: '모임' }} />
      <Stack.Screen name="hidden" options={{ title: '숨긴 건' }} />
    </Stack>
  );
}
