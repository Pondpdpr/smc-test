import z from 'zod';

import { UserResponse } from '@/domain/base/user/user.domain';
import { userFilterZod, userSortZod } from '@/domain/base/user/user.zod';
import {
  IPagination,
  IResponse,
  IStandardResponseWithMeta,
} from '@/shared/type/type.http';
import { paginationZod, zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  sort: userSortZod,
  pagination: paginationZod,
  filter: userFilterZod,
  countFilter: userFilterZod,
});

export type ListUsersQueryInput = z.input<typeof zod>;
export class ListUsersDto extends zodDto(zod) {}

// Response

export type ListUsersResponse = IStandardResponseWithMeta<
  {
    users: IResponse<UserResponse>[];
  },
  {
    pagination: IPagination;
  }
>;
