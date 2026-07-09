import { faker } from '@faker-js/faker';

import { uuidV7 } from '@/shared/common/common.crypto';
import { valueOr } from '@/shared/common/common.func';

import type { Message } from './message.domain';

export function mockMessage(data?: Partial<Message>): Message {
  return {
    id: valueOr(data?.id, uuidV7()),
    conversationId: valueOr(data?.conversationId, uuidV7()),
    role: valueOr(data?.role, 'user'),
    content: valueOr(data?.content, faker.lorem.sentence()),
    toolCall: valueOr(data?.toolCall, null),
    stopped: valueOr(data?.stopped, false),
    costUsdMicros: valueOr(data?.costUsdMicros, '0'),
    createdAt: valueOr(data?.createdAt, new Date()),
  };
}

export function mockMessages(
  amount: number,
  data?: Partial<Message>,
): Message[] {
  return Array(amount)
    .fill(0)
    .map(() => mockMessage(data));
}
