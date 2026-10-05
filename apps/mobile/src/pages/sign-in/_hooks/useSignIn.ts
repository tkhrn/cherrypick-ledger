import { useMutation } from '@tanstack/react-query';
import { createEmailOtp, createGoogleSession, verifyEmailOtp } from '@/apis/auth';

/** 로그인 방법들: Google(기본), 이메일 링크·코드(보조) */
export function useSignIn() {
  const google = useMutation({ mutationFn: () => createGoogleSession() });
  const requestCode = useMutation({ mutationFn: (email: string) => createEmailOtp(email) });
  const verifyCode = useMutation({ mutationFn: ({ email, code }: { email: string; code: string }) => verifyEmailOtp(email, code) });
  return { google, requestCode, verifyCode };
}
