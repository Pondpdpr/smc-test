import { api } from '@/shared/lib/api-client';
import { apiPaths } from '@/shared/lib/api-paths';
import type { IStandardResponse } from '@/shared/lib/type.http';

import type { DeleteConversationResult, GetMessagesResult, ListConversationsResult } from './conversations.type';

export async function listConversations(): Promise<IStandardResponse<ListConversationsResult>> {
  return api.get<ListConversationsResult>(apiPaths.conversations.list);
}

export async function getMessages(
  conversationId: string,
): Promise<IStandardResponse<GetMessagesResult>> {
  return api.get<GetMessagesResult>(apiPaths.conversations.messages(conversationId));
}

export async function deleteConversation(
  conversationId: string,
): Promise<IStandardResponse<DeleteConversationResult>> {
  return api.delete<DeleteConversationResult>(apiPaths.conversations.delete(conversationId));
}
