import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Chip } from '@/components/atoms/Chip';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { SettingsRow } from '@/components/molecules/SettingsRow';
import { FONT, SPACE } from '@/constants/theme';
import { useAiUsage } from '@/hooks/useAiUsage';
import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';
import { useSignOut } from '@/hooks/useSignOut';
import { useCaptureHealth } from '@/hooks/useCaptureHealth';
import { useCaptureSources } from '@/hooks/useCaptureSources';
import { useTheme } from '@/hooks/useTheme';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatDayKey, kstDayKey, kstTime } from '@/utils/kstDate';
import { requestSmsPermission } from '@/utils/smsPermission';
import { HourPicker } from './_components/HourPicker';
import { UsageBar } from './_components/UsageBar';
import { AI_CAP_OPTIONS } from './_types';

export default function SettingsPage() {
  const { colors, status } = useTheme();
  const { settings, save } = useUserSettings();
  const { enabledApps, smsEnabled, save: saveSources } = useCaptureSources();
  const capture = useCaptureHealth();
  const { calls, cap, lastError: aiError } = useAiUsage();
  const { reconnect, isReconnecting } = useDeviceRegistration();
  const signOut = useSignOut();
  const [isPickingHour, setIsPickingHour] = useState(false);
  const digestTime = settings?.digest_time.slice(0, 5) ?? '21:00';

  const handleSmsToggle = async (enabled: boolean) => {
    const granted = !enabled || (await requestSmsPermission());
    saveSources.mutate({ selected: enabledApps.map((a) => ({ packageName: a.package_name, label: a.label })), smsEnabled: enabled && granted });
  };

  const lastCaptured = capture.status.lastCapturedAt
    ? `${formatDayKey(kstDayKey(new Date(capture.status.lastCapturedAt).toISOString()))} ${kstTime(new Date(capture.status.lastCapturedAt).toISOString())}`
    : '아직 없음';

  return (
    <ScreenLayout>
      <Text style={[FONT.title, styles.title, { color: colors.textPrimary }]}>설정</Text>
      <ScrollView>
        <SectionHeader title="수집" />
        <SettingsRow label="분석할 앱" value={`${enabledApps.length}개`} onPress={() => router.push('/setup/apps')} />
        <SettingsRow label="문자 수집" trailing={<Switch value={smsEnabled} onValueChange={handleSmsToggle} />} />
        <SettingsRow label="알림 접근" value={capture.isAvailable ? (capture.isGranted ? '켜짐' : '꺼짐') : '개발 빌드 필요'} />
        <SettingsRow label="마지막 수집" value={lastCaptured} />
        <SettingsRow label="업로드 대기" value={`${capture.status.pendingCount}건`}>
          {capture.isAvailable && (!capture.status.isConfigured || capture.status.lastUploadError === 'device_revoked') ? (
            <Text style={[FONT.caption, { color: status.cancelled.fg }]} onPress={reconnect}>
              {isReconnecting ? '다시 연결하는 중…' : '업로드 연결이 끊겼어요. 눌러서 다시 연결'}
            </Text>
          ) : null}
        </SettingsRow>
        <SettingsRow label="배터리 최적화 예외" onPress={() => Linking.openSettings()} />

        <SectionHeader title="정리" />
        <SettingsRow label="내 계좌" onPress={() => router.push('/setup/accounts')} />
        <SettingsRow label="카테고리" onPress={() => router.push('/setup/categories')} />
        <SettingsRow label="모임" onPress={() => router.push('/setup/groups')} />
        <SettingsRow label="숨긴 건 보기" onPress={() => router.push('/setup/hidden')} />

        <SectionHeader title="알림" />
        <SettingsRow label="정리 알림 시각" value={digestTime} onPress={() => setIsPickingHour((v) => !v)}>
          {isPickingHour ? <HourPicker value={digestTime} onChange={(h) => save.mutate({ digest_time: h })} /> : null}
        </SettingsRow>

        <SectionHeader title="AI" />
        <SettingsRow label="이번 달 AI 호출" value={`${calls} / ${cap}회`}>
          <UsageBar ratio={cap > 0 ? calls / cap : 1} />
          {aiError ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>{`최근 정리에서 AI를 쓰지 못했어요 (${aiError})`}</Text> : null}
          <View style={styles.chips}>
            {AI_CAP_OPTIONS.map((option) => (
              <Chip key={option} label={`월 ${option}회`} selected={cap === option} tone={status.group} onPress={() => save.mutate({ ai_monthly_call_cap: option })} />
            ))}
          </View>
        </SettingsRow>

        <SectionHeader title="계정" />
        <SettingsRow label="로그아웃" onPress={signOut} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md },
  chips: { flexDirection: 'row', gap: SPACE.sm },
});
