import z from 'zod';

import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  username: z.string(),
  password: z.string(),
});

export class SignInDto extends zodDto(zod) {}

export type SignInResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
  token: string;
}>;
