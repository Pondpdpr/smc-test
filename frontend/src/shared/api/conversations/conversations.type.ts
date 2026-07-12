import type { Conversation } from '@/shared/domain/conversation.domain';
import type { Message } from '@/shared/domain/message.domain';
import type { IResponse } from '@/shared/lib/type.http';

export type ListConversationsResult = {
  conversations: IResponse<Conversation>[];
};

export type GetMessagesResult = {
  messages: IResponse<Message>[];
};

export type DeleteConversationResult = {
  conversation: IResponse<Conversation>;
};
