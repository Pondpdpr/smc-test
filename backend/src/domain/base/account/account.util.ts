import type { EB } from '@/infra/db/db.common';
import { hashString, uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type {
  Account,
  AccountNewData,
  AccountUpdateData,
} from './account.domain';

export function accountsTableFilter(eb: EB<'accounts'>) {
  return eb.and([]);
}

export function newAccount(data: AccountNewData): Account {
  return {
    id: uuidV7(),
    createdAt: myDayjs().toDate(),
    updatedAt: myDayjs().toDate(),
    username: data.username,
    password: hashString(data.password),
    lastSignedInAt: null,
  };
}

export function newAccounts(data: AccountNewData[]): Account[] {
  return data.map((d) => newAccount(d));
}

export function editAccount(entity: Account, data: AccountUpdateData): Account {
  return {
    [$pgState]: getPgState(entity),
    id: entity.id,
    createdAt: entity.createdAt,

    // Update
    username: valueOr(data.username, entity.username),
    password: data.password ? hashString(data.password) : entity.password,
    lastSignedInAt: valueOr(data.lastSignedInAt, entity.lastSignedInAt),
    updatedAt: myDayjs().toDate(),
  };
}
