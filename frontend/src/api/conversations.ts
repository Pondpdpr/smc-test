import { api } from '@/lib/api-client';
import { apiPaths } from '@/lib/api-paths';
import type { Conversation, Message } from '@/lib/types';

export async function listConversations() {
  const data = await api.get<{ conversations: { attributes: Conversation }[] }>(
    apiPaths.conversations.list,
  );
  return data.conversations.map((c) => c.attributes);
}

export async function getMessages(conversationId: string) {
  const data = await api.get<{ messages: { attributes: Message }[] }>(
    apiPaths.conversations.messages(conversationId),
  );
  return data.messages.map((m) => m.attributes);
}

export async function deleteConversation(conversationId: string) {
  const data = await api.delete<{ conversation: { attributes: Conversation } }>(
    apiPaths.conversations.delete(conversationId),
  );
  return data.conversation.attributes;
}
