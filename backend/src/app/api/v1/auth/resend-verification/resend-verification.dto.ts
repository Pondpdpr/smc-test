import z from 'zod';

import { IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  email: z.email(),
});

export class ResendVerificationDto extends zodDto(zod) {}

// ====== Response =====

export type ResendVerificationResponse = IStandardResponse<{
  sent: boolean;
}>;
