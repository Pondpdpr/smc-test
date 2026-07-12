import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteConversation, getMessages, listConversations } from './conversations.api';

// Key factory so invalidation call sites reference the same hierarchy the
// queries were registered under (e.g. invalidating all() also invalidates
// list()).
export const conversationsQueryKeys = {
  all: () => ['conversations'] as const,
  list: () => [...conversationsQueryKeys.all(), 'list'] as const,
  messages: (conversationId: string) =>
    [...conversationsQueryKeys.all(), conversationId, 'messages'] as const,
};

// api.ts returns the full IStandardResponse envelope untouched (success/key/
// data, IResponse<T>[] wrappers and all) - `select` is where that gets
// flattened to what the UI actually wants, keeping the api layer a pure
// "call it, return what came back" boundary.
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

// Cache invalidation lives here (the query-cache mechanics), not in the
// component - callers still get mutateAsync's promise to layer their own
// UX (toasts, clearing local state) on top via the call site.
export function useDeleteConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationsQueryKeys.list() });
    },
  });
}
