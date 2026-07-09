import z from 'zod';

import { toSplitCommaArray } from './common.transformer';
import { isUuid } from './common.validator';

export const parmUuidsZod = z
  .string()
  .transform(toSplitCommaArray)
  .refine((v) => v.every(isUuid), { message: 'invalidUuid' });
