import { api } from '@/lib/api-client';
import { apiPaths } from '@/lib/api-paths';
import type { User } from '@/lib/types';

type UserAttributes = { attributes: User };

export async function signIn(username: string, password: string) {
  const data = await api.post<{ user: UserAttributes; token: string }>(apiPaths.auth.signIn, {
    username,
    password,
  });
  return { user: data.user.attributes, token: data.token };
}

export async function signUp(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const data = await api.post<{ user: UserAttributes }>(
    apiPaths.auth.signUp,
    {
      account: { username: input.email, password: input.password },
      user: { email: input.email, firstName: input.firstName, lastName: input.lastName },
    },
    { headers: { 'idempotency-key': crypto.randomUUID() } },
  );
  return { user: data.user.attributes };
}

export async function verifyEmail(token: string) {
  const data = await api.post<{ user: UserAttributes }>(apiPaths.auth.verifyEmail, { token });
  return { user: data.user.attributes };
}

export async function resendVerification(email: string) {
  return api.post<{ sent: boolean }>(apiPaths.auth.resendVerification, { email });
}
