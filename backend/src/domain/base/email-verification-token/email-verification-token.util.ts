import type { EB } from '@/infra/db/db.common';
import { shaHashstring, uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { valueOr } from '@/shared/common/common.func';

import { EMAIL_VERIFICATION_TOKEN_EXPIRY_SECONDS } from './email-verification-token.constant';
import type {
  EmailVerificationToken,
  EmailVerificationTokenNewData,
} from './email-verification-token.domain';

export function emailVerificationTokensTableFilter(
  eb: EB<'email_verification_tokens'>,
) {
  return eb.and([]);
}

export function newEmailVerificationToken(
  data: EmailVerificationTokenNewData,
): EmailVerificationToken {
  return {
    id: uuidV7(),
    userId: data.userId,
    tokenHash: shaHashstring(data.token),
    createdAt: myDayjs().toDate(),
    expiresAt: valueOr(
      data.expiresAt,
      myDayjs()
        .add(EMAIL_VERIFICATION_TOKEN_EXPIRY_SECONDS, 'seconds')
        .toDate(),
    ),
  };
}
