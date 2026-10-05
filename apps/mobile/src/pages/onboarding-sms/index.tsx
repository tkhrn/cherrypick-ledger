import { router } from 'expo-router';
import { PermissionsAndroid, Platform } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { StepLayout } from '@/components/layouts/StepLayout';

async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export default function OnboardingSmsPage() {
  const goNext = (smsEnabled: boolean) => router.push({ pathname: '/onboarding/apps', params: { sms: smsEnabled ? '1' : '0' } });

  const handleAllow = async () => goNext(await requestSmsPermission());

  return (
    <StepLayout
      title="결제 문자도 읽을까요?"
      description="카드 승인 문자나 은행 입출금 문자를 받는다면 함께 분석해요. 앱 알림만 쓴다면 건너뛰어도 돼요."
      footer={
        <>
          <Button label="문자 권한 허용" variant="primary" onPress={handleAllow} />
          <Button label="건너뛰기" variant="ghost" onPress={() => goNext(false)} />
        </>
      }
    />
  );
}
