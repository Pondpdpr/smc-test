import { faker } from '@faker-js/faker';

import {
  DEFAULT_PASSWORD,
  TEST_ACCOUNT_ID,
} from '@/shared/common/common.constant';
import { hashString, uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { valueOr } from '@/shared/common/common.func';

import type { Account } from './account.domain';

export function mockAccount(data?: Partial<Account>): Account {
  return {
    id: valueOr(data?.id, uuidV7()),
    createdAt: valueOr(data?.createdAt, myDayjs().toDate()),
    updatedAt: valueOr(data?.updatedAt, myDayjs().toDate()),
    username: valueOr(data?.username, faker.internet.username()),
    password: data?.password
      ? hashString(data.password)
      : hashString('password'),
    lastSignedInAt: valueOr(data?.lastSignedInAt, null),
  };
}

export function mockTestAccount(): Account {
  return mockAccount({
    id: TEST_ACCOUNT_ID,
    username: 'testuser@example.com',
    password: DEFAULT_PASSWORD,
  });
}

export function mockAccounts(
  amount: number,
  data?: Partial<Account>,
): Account[] {
  return Array(amount)
    .fill(0)
    .map(() => mockAccount(data));
}
