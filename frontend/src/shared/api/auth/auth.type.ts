import type { User } from '@/shared/domain/user.domain';
import type { IResponse } from '@/shared/lib/type.http';

// Kept as IResponse<User>, not flattened to User - api.ts functions return
// exactly what the backend sent, callers unwrap .attributes.
export type SignInResult = {
  user: IResponse<User>;
  token: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type SignUpResult = {
  user: IResponse<User>;
};

export type VerifyEmailResult = {
  user: IResponse<User>;
};

// Not a domain entity, so no IResponse wrapper on the backend side either.
export type ResendVerificationResult = {
  sent: boolean;
};
