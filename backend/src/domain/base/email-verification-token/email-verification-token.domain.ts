import type { EmailVerificationTokens } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

type EmailVerificationTokenPlain = {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
};

export type EmailVerificationTokenPg = DBModel<EmailVerificationTokens>;
export type EmailVerificationToken = WithState<EmailVerificationTokenPg> &
  EmailVerificationTokenPlain;
export type EmailVerificationTokenJson = WithState<EmailVerificationTokenPg> &
  Serialized<EmailVerificationTokenPlain>;

// Single-use, no UpdateData/edit() - a row existing means valid & unused;
// verifying deletes the row (see email-verification-token.service.ts).
export type EmailVerificationTokenNewData = {
  userId: string;
  token: string; // raw token - only the hash is persisted
  expiresAt?: Date;
};
