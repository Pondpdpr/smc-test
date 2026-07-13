import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteConversation, getMessages, listConversations } from './conversations.api';

// Key factory so invalidating all() also invalidates list().
export const conversationsQueryKeys = {
  all: () => ['conversations'] as const,
  list: () => [...conversationsQueryKeys.all(), 'list'] as const,
  messages: (conversationId: string) =>
    [...conversationsQueryKeys.all(), conversationId, 'messages'] as const,
};

// api.ts returns the raw envelope - `select` flattens it to what the UI wants.
export function useConversationsQuery() {
  return useQuery({
    queryKey: conversationsQueryKeys.list(),
    queryFn: listConversations,
    select: (res) => res.data.conversations.map((c) => c.attributes),
  });
}

export function useMessagesQuery(conversationId: string | null) {
  return useQuery({
    queryKey: conversationsQueryKeys.messages(conversationId ?? ''),
    queryFn: () => getMessages(conversationId!),
    select: (res) => res.data.messages.map((m) => m.attributes),
    enabled: !!conversationId,
  });
}

// Cache invalidation lives here; callers layer their own UX via mutateAsync's promise.
export function useDeleteConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationsQueryKeys.list() });
    },
  });
}
