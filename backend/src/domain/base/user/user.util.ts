import type { EB } from '@/infra/db/db.common';
import { uuidV7 } from '@/shared/common/common.crypto';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type { User, UserNewData, UserUpdateData } from './user.domain';

export function usersTableFilter(eb: EB<'users'>) {
  return eb.and([]);
}

export function newUser(data: UserNewData): User {
  return {
    id: uuidV7(),
    email: data.email,
    accountId: data.accountId,
    firstName: data.firstName,
    lastName: data.lastName,
    userStatus: valueOr(data.userStatus, 'ACTIVE'),
    emailVerifiedAt: null,
  };
}

export function newUsers(data: UserNewData[]): User[] {
  return data.map((d) => newUser(d));
}

export function editUser(entity: User, data: UserUpdateData): User {
  return {
    [$pgState]: getPgState(entity),
    id: entity.id,
    accountId: entity.accountId,
    emailVerifiedAt: entity.emailVerifiedAt,

    // Update
    email: valueOr(data.email, entity.email),
    firstName: valueOr(data.firstName, entity.firstName),
    lastName: valueOr(data.lastName, entity.lastName),
    userStatus: valueOr(data.userStatus, entity.userStatus),
  };
}

// Only called from the email verification flow (verify-email.command.ts) -
// never exposed through UserUpdateData/the generic update-user endpoint.
export function markEmailVerified(entity: User): User {
  return {
    [$pgState]: getPgState(entity),
    id: entity.id,
    accountId: entity.accountId,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    userStatus: entity.userStatus,
    emailVerifiedAt: new Date(),
  };
}

export function getUserFullName(entity: User): string {
  return `${entity.firstName} ${entity.lastName}`;
}
