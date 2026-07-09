import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import { toDate } from '@/shared/common/common.transformer';

import type {
  EmailVerificationTokenJson,
  EmailVerificationTokenPg,
} from './email-verification-token.domain';
import { EmailVerificationToken } from './email-verification-token.domain';

export function emailVerificationTokenFromPg(
  data: EmailVerificationTokenPg,
): EmailVerificationToken {
  const token: EmailVerificationToken = {
    id: data.id,
    userId: data.user_id,
    tokenHash: data.token_hash,
    expiresAt: toDate(data.expires_at),
    createdAt: toDate(data.created_at),
  };
  return setPgState(token, data);
}

export function emailVerificationTokenFromJson(
  data: EmailVerificationTokenJson,
): EmailVerificationToken {
  return {
    id: data.id,
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: toDate(data.expiresAt),
    createdAt: toDate(data.createdAt),
    [$pgState]: getPgState(data),
  };
}

export function emailVerificationTokenToPg(
  data: EmailVerificationToken,
): EmailVerificationTokenPg {
  return {
    id: data.id,
    user_id: data.userId,
    token_hash: data.tokenHash,
    expires_at: data.expiresAt.toISOString(),
    created_at: data.createdAt.toISOString(),
  };
}

export function emailVerificationTokenToJson(
  data: EmailVerificationToken,
): EmailVerificationTokenJson {
  return {
    id: data.id,
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt.toISOString(),
    createdAt: data.createdAt.toISOString(),
    [$pgState]: getPgState(data),
  };
}
