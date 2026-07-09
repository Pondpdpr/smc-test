import { faker } from '@faker-js/faker';

import { TEST_ACCOUNT_ID, TEST_USER_ID } from '@/shared/common/common.constant';
import { uuidV7 } from '@/shared/common/common.crypto';
import { valueOr } from '@/shared/common/common.func';

import type { User } from './user.domain';

export function mockUser(data?: Partial<User>): User {
  return {
    id: valueOr(data?.id, uuidV7()),
    email: valueOr(data?.email, faker.internet.email()),
    firstName: valueOr(data?.firstName, faker.person.firstName()),
    lastName: valueOr(data?.lastName, faker.person.lastName()),
    userStatus: valueOr(data?.userStatus, 'ACTIVE'),
    accountId: valueOr(data?.accountId, uuidV7()),
    emailVerifiedAt: valueOr(data?.emailVerifiedAt, new Date()),
  };
}

export function mockUsers(amount: number, data?: Partial<User>): User[] {
  return Array(amount)
    .fill(0)
    .map(() => mockUser(data));
}

export function mockTestUser(): User {
  return mockUser({
    id: TEST_USER_ID,
    email: 'testuser@example.com',
    firstName: 'tester',
    lastName: 'tester',
    userStatus: 'ACTIVE',
    accountId: TEST_ACCOUNT_ID,
  });
}
