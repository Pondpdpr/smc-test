import type { MessageStatus } from '@/infra/db/db';
import type { PaginationQuery } from '@/shared/common/common.pagination';
import type { ParsedSort } from '@/shared/type/type.common';

export type MessageTaskSortKey = 'id' | 'createdAt' | 'updatedAt';

export type MessageTaskQueryOptions = {
  filter?: {
    queueName?: string;
    exchangeName?: string;
    messageStatus?: MessageStatus;
  };
  sort?: ParsedSort<MessageTaskSortKey>;
  pagination?: PaginationQuery;
};

export type ProcessMessageOpts = {
  queueName: string;
  exchangeName: string;
  payload: Record<string, any>;
};
