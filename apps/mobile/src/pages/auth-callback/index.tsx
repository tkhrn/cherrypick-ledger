import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { createSessionFromCode } from '@/apis/auth';
import { getUserSettings } from '@/apis/user_settings';
import { BRAND, FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** 메일의 로그인 링크가 여는 화면. code를 세션으로 바꾸고 홈으로 보낸다 */
export default function AuthCallbackPage() {
  const { colors, scheme } = useTheme();
  const { code, error_description: linkError } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const exchange = useMutation({
    mutationFn: async (linkCode: string) => {
      await createSessionFromCode(linkCode);
      return getUserSettings();
    },
    // 로그인 후에는 첫 설정 여부에 따라 갈 곳이 다르다 (보호된 경로라 '/'로만 보내면 막힌다)
    onSuccess: (settings) => router.replace(settings?.onboarded_at ? '/' : '/onboarding'),
  });
  const { mutate } = exchange;

  useEffect(() => {
    if (code) mutate(code);
  }, [code, mutate]);

  const failed = Boolean(linkError) || !code || exchange.isError;
  return (
    <View style={[styles.center, { backgroundColor: scheme === 'light' ? BRAND.cream : colors.bgPage }]}>
      {failed ? (
        <>
          <Text style={[FONT.body, { color: colors.textPrimary }]}>로그인 링크가 만료됐거나 올바르지 않아요</Text>
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>앱에서 링크를 다시 받아 주세요.</Text>
          <Button label="다시 받기" variant="brand" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <>
          <ActivityIndicator color={BRAND.cherry} />
          <Text style={[FONT.body, { color: colors.textSecondary }]}>로그인하는 중…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.md, padding: SPACE.xl } });
