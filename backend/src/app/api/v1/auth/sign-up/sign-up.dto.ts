import z from 'zod';

import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  account: z.object({
    username: z.string(),
    password: z.string(),
  }),
  user: z.object({
    email: z.email().optional(),
    firstName: z.string(),
    lastName: z.string(),
  }),
});

export class SignupDto extends zodDto(zod) {}

// ====== Response =====

export type SignUpResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
}>;
