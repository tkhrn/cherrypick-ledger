import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { CherryMark } from '@/components/atoms/CherryMark';
import { TextField } from '@/components/atoms/TextField';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { BRAND, FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { HowItWorks } from './_components/HowItWorks';
import { GoogleButton } from './_components/GoogleButton';
import { useSignIn } from './_hooks/useSignIn';
import { EMAIL_PATTERN, MIN_CODE_LENGTH, type SignInStep } from './_types';

const MARK_SIZE = 88;

export default function SignInPage() {
  const { colors, scheme, status } = useTheme();
  const { google, requestCode, verifyCode } = useSignIn();
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const pageBackground = scheme === 'light' ? BRAND.cream : colors.bgPage;

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
    <ScreenLayout edges={['top', 'bottom']} background={pageBackground}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <CherryMark size={MARK_SIZE} />
            <Text style={[styles.wordmark, { color: colors.textPrimary }]}>Cherrypick</Text>
            <Text style={[FONT.body, { color: colors.textSecondary }]}>내 소비만 골라 담는 가계부</Text>
          </View>

          <HowItWorks />

          <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
            <GoogleButton onPress={() => google.mutate()} isLoading={google.isPending} />
            {google.error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>{`Google 로그인에 실패했어요. ${google.error.message}`}</Text> : null}

            {isEmailOpen ? (
              <View style={styles.emailForm}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                {step === 'email' ? (
                  <>
                    <TextField
                      label="이메일로 시작하기"
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
                    <Button label="로그인 링크 받기" variant="secondary" isLoading={requestCode.isPending} onPress={handleRequestCode} />
                  </>
                ) : (
                  <>
                    <Text style={[FONT.body, { color: colors.textPrimary }]}>메일함을 확인해 주세요</Text>
                    <Text style={[FONT.caption, { color: colors.textSecondary }]}>{`${email}로 보낸 메일의 로그인 링크를 이 폰에서 누르면 바로 들어와요. 메일에 코드가 있다면 아래에 입력해도 돼요.`}</Text>
                    <TextField
                      placeholder="메일로 받은 코드"
                      keyboardType="number-pad"
                      value={code}
                      onChangeText={setCode}
                      errorText={verifyCode.error ? '코드가 맞지 않아요. 다시 확인해 주세요' : null}
                    />
                    <Button label="로그인" variant="brand" isLoading={verifyCode.isPending} disabled={code.trim().length < MIN_CODE_LENGTH} onPress={handleVerify} />
                    <Button label="이메일 다시 입력" variant="ghost" onPress={() => setStep('email')} />
                  </>
                )}
              </View>
            ) : (
              <Button label="이메일로 로그인" variant="ghost" onPress={() => setIsEmailOpen(true)} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: SPACE.xl, gap: SPACE.xl },
  hero: { alignItems: 'center', gap: SPACE.sm },
  wordmark: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5, marginTop: SPACE.sm },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.lg, padding: SPACE.lg, gap: SPACE.md },
  emailForm: { gap: SPACE.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: SPACE.xs },
});
