import type { Accounts } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

type AccountPlain = {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;
  username: string;
  password: string;
  lastSignedInAt: Date | null;
};

export type AccountPg = DBModel<Accounts>;
export type Account = WithState<AccountPg> & AccountPlain;
export type AccountJson = WithState<AccountPg> & Serialized<AccountPlain>;

export type AccountResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastSignedInAt: string | null;
};

export type AccountNewData = {
  username: string;
  password: string;
};

export type AccountUpdateData = {
  username?: string;
  password?: string;
  lastSignedInAt?: Date | null;
};
