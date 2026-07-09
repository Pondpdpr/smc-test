import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import { toDate, toResponseDate } from '@/shared/common/common.transformer';

import type { UserJson, UserPg, UserResponse } from './user.domain';
import { User } from './user.domain';

export function userFromPg(data: UserPg): User {
  const user: User = {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    userStatus: data.user_status,
    accountId: data.account_id,
    emailVerifiedAt: toDate(data.email_verified_at),
  };

  return setPgState(user, data);
}

export function userFromJson(data: UserJson): User {
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    userStatus: data.userStatus,
    accountId: data.accountId,
    emailVerifiedAt: toDate(data.emailVerifiedAt),
    [$pgState]: getPgState(data),
  };
}

export function userToPg(data: User): UserPg {
  return {
    id: data.id,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    user_status: data.userStatus,
    account_id: data.accountId,
    email_verified_at: data.emailVerifiedAt?.toISOString() ?? null,
  };
}

export function userToResponse(data: User): UserResponse {
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    userStatus: data.userStatus,
    emailVerifiedAt: data.emailVerifiedAt
      ? toResponseDate(data.emailVerifiedAt)
      : null,
  };
}

export function userPgToResponse(data: UserPg): UserResponse {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    userStatus: data.user_status,
    emailVerifiedAt: data.email_verified_at
      ? toResponseDate(data.email_verified_at)
      : null,
  };
}

export function userToJson(data: User): UserJson {
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    userStatus: data.userStatus,
    accountId: data.accountId,
    emailVerifiedAt: data.emailVerifiedAt
      ? data.emailVerifiedAt.toISOString()
      : null,
    [$pgState]: getPgState(data),
  };
}
