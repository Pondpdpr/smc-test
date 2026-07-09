import { faker } from '@faker-js/faker';

import { uuidV7 } from '@/shared/common/common.crypto';
import { valueOr } from '@/shared/common/common.func';

import type { Conversation } from './conversation.domain';

export function mockConversation(data?: Partial<Conversation>): Conversation {
  return {
    id: valueOr(data?.id, uuidV7()),
    userId: valueOr(data?.userId, uuidV7()),
    title: valueOr(data?.title, faker.lorem.sentence()),
    createdAt: valueOr(data?.createdAt, new Date()),
    updatedAt: valueOr(data?.updatedAt, new Date()),
  };
}

export function mockConversations(
  amount: number,
  data?: Partial<Conversation>,
): Conversation[] {
  return Array(amount)
    .fill(0)
    .map(() => mockConversation(data));
}
