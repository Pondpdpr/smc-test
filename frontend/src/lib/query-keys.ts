// Central key factory so invalidation call sites reference the same
// hierarchy the queries were registered under (e.g. invalidating
// conversations.all() also invalidates conversations.list()).
export const queryKeys = {
  conversations: {
    all: () => ['conversations'] as const,
    list: () => [...queryKeys.conversations.all(), 'list'] as const,
    messages: (conversationId: string) =>
      [...queryKeys.conversations.all(), conversationId, 'messages'] as const,
  },
  usage: () => ['usage'] as const,
};
