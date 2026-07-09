import type { EB } from '@/infra/db/db.common';
import { uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { valueOr } from '@/shared/common/common.func';

import type { Message, MessageNewData } from './message.domain';

export function messagesTableFilter(eb: EB<'messages'>) {
  return eb.and([]);
}

export function newMessage(data: MessageNewData): Message {
  return {
    id: uuidV7(),
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    toolCall: valueOr(data.toolCall, null),
    stopped: valueOr(data.stopped, false),
    costUsdMicros: valueOr(data.costUsdMicros, '0'),
    createdAt: myDayjs().toDate(),
  };
}

export function newMessages(data: MessageNewData[]): Message[] {
  return data.map((d) => newMessage(d));
}
