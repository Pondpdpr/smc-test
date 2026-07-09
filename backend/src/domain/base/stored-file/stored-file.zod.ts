import z from 'zod';

import { toNumber } from '@/shared/common/common.transformer';
import { isNumericString } from '@/shared/common/common.validator';
import { zodDto } from '@/shared/zod/zod.util';

export const storedFileZod = z.object({
  id: z.string(),
  filename: z.string(),
});

export const getPresignedUploadUrlZod = z.object({
  amount: z
    .string()
    .refine(isNumericString, { message: 'invalidAmount' })
    .transform(toNumber),
});
export class GetPresignUploadUrlDto extends zodDto(getPresignedUploadUrlZod) {}
