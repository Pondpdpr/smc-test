import z from 'zod';

import { USER_STATUS } from '@/domain/base/user/user.constant';
import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userStatus: z.enum(USER_STATUS).optional(),
});

export class UpdateUserDto extends zodDto(zod) {}

// ======= Response =======

export type UpdateUserResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
}>;
