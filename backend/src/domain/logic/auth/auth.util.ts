import type { Account } from '@/domain/base/account/account.domain';
import { editAccount } from '@/domain/base/account/account.util';
import type { User } from '@/domain/base/user/user.domain';
import { encodeUserJwt, isMatchedHash } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { ApiException } from '@/shared/http/http.exception';

export function signIn(account: Account, password: string): Account {
  const matched = isMatchedHash(password, account.password);
  if (!matched) {
    throw new ApiException(400, 'invalidAuth');
  }
  return editAccount(account, { lastSignedInAt: myDayjs().toDate() });
}

type GetAccessTokenOpts = {
  user: User;
  account: Account;
};
export function getAccessToken(entity: GetAccessTokenOpts) {
  return encodeUserJwt({
    userId: entity.user.id,
    accountId: entity.account.id,
  });
}
