import type { EB } from '@/infra/db/db.common';
import { uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type {
  Conversation,
  ConversationNewData,
  ConversationUpdateData,
} from './conversation.domain';

export function conversationsTableFilter(eb: EB<'conversations'>) {
  return eb.and([]);
}

export function newConversation(data: ConversationNewData): Conversation {
  return {
    id: uuidV7(),
    userId: data.userId,
    title: valueOr(data.title, 'New conversation'),
    createdAt: myDayjs().toDate(),
    updatedAt: myDayjs().toDate(),
  };
}

export function newConversations(data: ConversationNewData[]): Conversation[] {
  return data.map((d) => newConversation(d));
}

export function editConversation(
  entity: Conversation,
  data: ConversationUpdateData,
): Conversation {
  return {
    [$pgState]: getPgState(entity),
    id: entity.id,
    userId: entity.userId,
    createdAt: entity.createdAt,

    // Update
    title: valueOr(data.title, entity.title),
    updatedAt: myDayjs().toDate(),
  };
}
