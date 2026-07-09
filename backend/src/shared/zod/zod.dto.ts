import { z } from 'zod';

import { zodDto } from './zod.util';

const zPagination = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(-1),
});
export type PaginationQuery = z.infer<typeof zPagination>;

export class PaginationDto extends zodDto(zPagination) {}
