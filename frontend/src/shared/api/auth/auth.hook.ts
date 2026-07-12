import { useMutation } from '@tanstack/react-query';

import { resendVerification, signIn, signUp, verifyEmail } from './auth.api';

export function useSignInMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signIn(email, password),
  });
}

export function useSignUpMutation() {
  return useMutation({ mutationFn: signUp });
}

export function useVerifyEmailMutation() {
  return useMutation({ mutationFn: verifyEmail });
}

export function useResendVerificationMutation() {
  return useMutation({ mutationFn: resendVerification });
}
