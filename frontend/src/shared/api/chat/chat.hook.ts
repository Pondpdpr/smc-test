import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getUsage, stopChat } from './chat.api';

export const chatQueryKeys = {
  usage: () => ['usage'] as const,
};

// streamChat has no hook here on purpose - see the comment in chat.api.ts.

export function useUsageQuery() {
  return useQuery({
    queryKey: chatQueryKeys.usage(),
    queryFn: getUsage,
    select: (res) => res.data,
    // Otherwise the badge only updates on a chat turn or tab refocus - someone
    // waiting out their reset would see stale numbers indefinitely.
    refetchInterval: 10_000,
  });
}

export function useStopChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stopChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.usage() });
    },
  });
}
