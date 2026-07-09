import { shaHashstring, uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { valueOr } from '@/shared/common/common.func';

import type { EmailVerificationToken } from './email-verification-token.domain';

export function mockEmailVerificationToken(
  data?: Partial<EmailVerificationToken> & { token?: string },
): EmailVerificationToken {
  return {
    id: valueOr(data?.id, uuidV7()),
    userId: valueOr(data?.userId, uuidV7()),
    tokenHash: valueOr(shaHashstring(data?.token), shaHashstring('test-token')),
    createdAt: valueOr(data?.createdAt, myDayjs().toDate()),
    expiresAt: valueOr(data?.expiresAt, myDayjs().add(24, 'hours').toDate()),
  };
}
