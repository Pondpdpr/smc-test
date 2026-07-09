import z from 'zod';

import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  token: z.string(),
});

export class VerifyEmailDto extends zodDto(zod) {}

// ====== Response =====

export type VerifyEmailResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
}>;
