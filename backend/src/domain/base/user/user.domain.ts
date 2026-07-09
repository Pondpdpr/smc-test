import type { Users, UsersStatus } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

type UserPlain = {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly userStatus: UsersStatus;
  readonly accountId: string;
  // Not user-editable via UserUpdateData - only set via the email
  // verification flow, see user.util.ts#markEmailVerified.
  readonly emailVerifiedAt: Date | null;
};

export type UserPg = DBModel<Users>;
export type User = WithState<UserPg> & UserPlain;
export type UserJson = WithState<UserPg> & Serialized<UserPlain>;

export type UserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: UsersStatus;
  emailVerifiedAt: string | null;
};

export type UserNewData = {
  email: string;
  firstName: string;
  lastName: string;
  accountId: string;
  userStatus?: UsersStatus;
};

export type UserUpdateData = {
  email?: string;
  firstName?: string;
  lastName?: string;
  userStatus?: UsersStatus;
};
