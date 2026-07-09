import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import { toDate, toResponseDate } from '@/shared/common/common.transformer';

import type { AccountJson, AccountPg, AccountResponse } from './account.domain';
import { Account } from './account.domain';

export function accountFromPg(data: AccountPg): Account {
  const account: Account = {
    id: data.id,
    createdAt: toDate(data.created_at),
    updatedAt: toDate(data.updated_at),
    username: data.username,
    password: data.password,
    lastSignedInAt: toDate(data.last_signed_in_at),
  };
  return setPgState(account, data);
}

export function accountFromJson(data: AccountJson): Account {
  return {
    id: data.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    username: data.username,
    password: data.password,
    lastSignedInAt: data.lastSignedInAt ? toDate(data.lastSignedInAt) : null,
    [$pgState]: getPgState(data),
  };
}

export function accountToPg(data: Account): AccountPg {
  return {
    id: data.id,
    created_at: data.createdAt.toISOString(),
    username: data.username,
    last_signed_in_at: data.lastSignedInAt?.toISOString() || null,
    password: data.password,
    updated_at: data.updatedAt.toISOString(),
  };
}

export function accountToResponse(data: Account): AccountResponse {
  return {
    id: data.id,
    createdAt: toResponseDate(data.createdAt),
    lastSignedInAt: data.lastSignedInAt
      ? toResponseDate(data.lastSignedInAt)
      : null,
    updatedAt: toResponseDate(data.updatedAt),
  };
}

export function accountPgToResponse(data: AccountPg): AccountResponse {
  return {
    id: data.id,
    createdAt: toResponseDate(data.created_at),
    lastSignedInAt: data.last_signed_in_at
      ? toResponseDate(data.last_signed_in_at)
      : null,
    updatedAt: toResponseDate(data.updated_at),
  };
}

export function accountToJson(data: Account): AccountJson {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    username: data.username,
    lastSignedInAt: data.lastSignedInAt
      ? data.lastSignedInAt.toISOString()
      : null,
    password: data.password,
    updatedAt: data.updatedAt.toISOString(),
    [$pgState]: getPgState(data),
  };
}
