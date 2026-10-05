import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { FONT, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { EMAIL_PATTERN, MIN_CODE_LENGTH, type SignInStep } from './_types';
import { useEmailSignIn } from './_hooks/useEmailSignIn';

export default function SignInPage() {
  const { colors } = useTheme();
  const { requestCode, verifyCode } = useEmailSignIn();
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleRequestCode = () => {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError('이메일 주소를 확인해 주세요');
      return;
    }
    setEmailError(null);
    requestCode.mutate(trimmed, { onSuccess: () => setStep('code') });
  };

  const handleVerify = () => verifyCode.mutate({ email: email.trim(), code: code.trim() });

  return (
    <ScreenLayout edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={[FONT.title, { color: colors.textPrimary }]}>cherrypick</Text>
        <Text style={[FONT.body, { color: colors.textSecondary }]}>내 소비만 골라 담는 가계부</Text>

        {step === 'email' ? (
          <View style={styles.form}>
            <TextField
              label="이메일"
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError(null);
              }}
              errorText={emailError ?? requestCode.error?.message}
            />
            <Button label="코드 받기" variant="primary" isLoading={requestCode.isPending} onPress={handleRequestCode} />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[FONT.caption, { color: colors.textSecondary }]}>{email}로 보낸 코드를 입력하세요.</Text>
            <TextField
              placeholder="메일로 받은 코드"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              errorText={verifyCode.error ? '코드가 맞지 않아요. 다시 확인해 주세요' : null}
            />
            <Button label="로그인" variant="primary" isLoading={verifyCode.isPending} disabled={code.trim().length < MIN_CODE_LENGTH} onPress={handleVerify} />
            <Button label="이메일 다시 입력" variant="ghost" onPress={() => setStep('email')} />
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: SPACE.xl, gap: SPACE.sm },
  form: { marginTop: SPACE.xl, gap: SPACE.md },
});
