import { useMutation } from '@tanstack/react-query';
import { createEmailOtp, verifyEmailOtp } from '@/apis/auth';

export function useEmailSignIn() {
  const requestCode = useMutation({ mutationFn: (email: string) => createEmailOtp(email) });
  const verifyCode = useMutation({ mutationFn: ({ email, code }: { email: string; code: string }) => verifyEmailOtp(email, code) });
  return { requestCode, verifyCode };
}
