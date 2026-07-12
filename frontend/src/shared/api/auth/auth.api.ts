import { api } from '@/shared/lib/api-client';
import { apiPaths } from '@/shared/lib/api-paths';
import type { IStandardResponse } from '@/shared/lib/type.http';

import type {
  ResendVerificationResult,
  SignInResult,
  SignUpInput,
  SignUpResult,
  VerifyEmailResult,
} from './auth.type';

export async function signIn(
  username: string,
  password: string,
): Promise<IStandardResponse<SignInResult>> {
  return api.post<SignInResult>(apiPaths.auth.signIn, { username, password });
}

export async function signUp(input: SignUpInput): Promise<IStandardResponse<SignUpResult>> {
  return api.post<SignUpResult>(
    apiPaths.auth.signUp,
    {
      account: { username: input.email, password: input.password },
      user: { email: input.email, firstName: input.firstName, lastName: input.lastName },
    },
    { headers: { 'idempotency-key': crypto.randomUUID() } },
  );
}

export async function verifyEmail(token: string): Promise<IStandardResponse<VerifyEmailResult>> {
  return api.post<VerifyEmailResult>(apiPaths.auth.verifyEmail, { token });
}

export async function resendVerification(
  email: string,
): Promise<IStandardResponse<ResendVerificationResult>> {
  return api.post<ResendVerificationResult>(apiPaths.auth.resendVerification, { email });
}
