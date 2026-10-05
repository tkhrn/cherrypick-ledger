import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { StepLayout } from '@/components/layouts/StepLayout';
import { SourceAppPicker } from '@/components/organisms/SourceAppPicker';
import { FONT } from '@/constants/theme';
import { useCaptureSources } from '@/hooks/useCaptureSources';
import type { InstalledApp } from '@/hooks/useInstalledApps';
import { useTheme } from '@/hooks/useTheme';

export default function OnboardingAppsPage() {
  const { status } = useTheme();
  const { sms } = useLocalSearchParams<{ sms?: string }>();
  const { save } = useCaptureSources();
  const [selected, setSelected] = useState<Map<string, InstalledApp>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (app: InstalledApp) => {
    setError(null);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(app.packageName)) next.delete(app.packageName);
      else next.set(app.packageName, app);
      return next;
    });
  };

  const handleNext = () => {
    if (selected.size === 0) {
      setError('앱을 하나 이상 골라 주세요');
      return;
    }
    save.mutate(
      { selected: [...selected.values()], smsEnabled: sms === '1' },
      { onSuccess: () => router.push('/onboarding/accounts') },
    );
  };

  return (
    <StepLayout
      title="어떤 앱의 알림을 분석할까요?"
      description="결제·이체 알림이 오는 앱을 골라 주세요. 설정에서 언제든 바꿀 수 있어요."
      footer={
        <>
          {error || save.error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>{error ?? '저장하지 못했어요. 다시 시도해 주세요'}</Text> : null}
          <Button label={`다음${selected.size > 0 ? ` (${selected.size})` : ''}`} variant="primary" isLoading={save.isPending} onPress={handleNext} />
        </>
      }
    >
      <SourceAppPicker selected={new Set(selected.keys())} onToggle={handleToggle} />
    </StepLayout>
  );
}
