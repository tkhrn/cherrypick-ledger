import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { StepLayout } from '@/components/layouts/StepLayout';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useNotificationAccess } from '@/hooks/useNotificationAccess';
import { useTheme } from '@/hooks/useTheme';

export default function OnboardingPermissionPage() {
  const { colors, status } = useTheme();
  const { isGranted, isAvailable, openSettings } = useNotificationAccess();
  const canContinue = isGranted || !isAvailable;

  return (
    <StepLayout
      title="결제 알림을 읽을 수 있게 해 주세요"
      description="카드·은행·페이 앱이 보내는 결제 알림을 모아서 정리해요. 고른 앱의 알림만 읽고, 다른 알림은 저장하지 않아요."
      footer={
        <>
          {!isGranted ? <Button label="권한 설정 열기" variant={isAvailable ? 'primary' : 'secondary'} onPress={openSettings} /> : null}
          <Button label="다음" variant={isGranted ? 'primary' : 'ghost'} disabled={!canContinue} onPress={() => router.push('/onboarding/sms')} />
        </>
      }
    >
      <View style={[styles.card, { backgroundColor: isGranted ? status.mine.bg : colors.bgSubtle }]}>
        <Text style={[FONT.body, { color: isGranted ? status.mine.fg : colors.textSecondary }]}>
          {isGranted ? '알림 접근이 켜져 있어요' : isAvailable ? '설정에서 Cherrypick 알림 접근을 켜고 돌아오세요' : '이 빌드에서는 알림 수집을 쓸 수 없어요 (개발 빌드 필요)'}
        </Text>
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({ card: { marginHorizontal: SPACE.xl, padding: SPACE.lg, borderRadius: RADIUS.md } });
