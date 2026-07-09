import z from 'zod';

import type { PaginationQuery } from '@/shared/common/common.pagination';
import { getSortZod } from '@/shared/zod/zod.util';

import { USER_STATUS } from './user.constant';

export const userFilterZod = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(USER_STATUS).optional(),
  })
  .optional();

export const userSortZod = getSortZod([
  'id',
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'lastSignedInAt',
]);

export type UserQueryOptions = {
  filter?: z.infer<typeof userFilterZod>;
  sort?: z.infer<typeof userSortZod>;
  pagination?: PaginationQuery;
};
export type UserFilterOptions = UserQueryOptions['filter'];
