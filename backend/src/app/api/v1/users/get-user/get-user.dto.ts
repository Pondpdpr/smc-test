import z from 'zod';

import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({});

export type GetUserQueryInput = z.input<typeof zod>;
export class GetUserDto extends zodDto(zod) {}

// Response

export type GetUserResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
}>;
