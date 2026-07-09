import type { UsersStatus } from '@/infra/db/db';
import { UnionArray } from '@/shared/type/type.common';

export const USER_STATUS: UnionArray<UsersStatus> = [
  'ACTIVE',
  'INACTIVE',
] as const;
