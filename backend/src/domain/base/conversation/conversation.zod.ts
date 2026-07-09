import z from 'zod';

import type { PaginationQuery } from '@/shared/common/common.pagination';
import { getSortZod } from '@/shared/zod/zod.util';

export const conversationFilterZod = z
  .object({
    userId: z.string().uuid().optional(),
    search: z.string().optional(),
  })
  .optional();

export const conversationSortZod = getSortZod([
  'id',
  'title',
  'createdAt',
  'updatedAt',
]);

export type ConversationQueryOptions = {
  filter?: z.infer<typeof conversationFilterZod>;
  sort?: z.infer<typeof conversationSortZod>;
  pagination?: PaginationQuery;
};
export type ConversationFilterOptions = ConversationQueryOptions['filter'];
