import { ScrollView, Text } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { StepLayout } from '@/components/layouts/StepLayout';
import { MyAccountsEditor } from '@/components/organisms/MyAccountsEditor';
import { FONT } from '@/constants/theme';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useTheme } from '@/hooks/useTheme';
import { useFinishOnboarding } from './_hooks/useFinishOnboarding';

export default function OnboardingAccountsPage() {
  const finish = useFinishOnboarding();
  const { accounts } = useMyAccounts();
  const { status } = useTheme();

  return (
    <StepLayout
      title="내 계좌를 알려 주세요"
      description="내 계좌끼리 옮긴 돈은 자동으로 숨겨요. 은행 이름과 계좌번호 끝 4자리만 있으면 돼요."
      footer={
        <>
        {finish.error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>시작하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요</Text> : null}
        <Button
          label={accounts.length > 0 ? '시작하기' : '나중에 등록하고 시작하기'}
          variant="primary"
          isLoading={finish.isPending}
          onPress={() => finish.mutate()}
        />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <MyAccountsEditor />
      </ScrollView>
    </StepLayout>
  );
}
