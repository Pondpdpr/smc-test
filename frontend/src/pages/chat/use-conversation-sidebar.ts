import { useState } from 'react';
import { toast } from 'sonner';

import {
  useConversationsQuery,
  useDeleteConversationMutation,
} from '@/shared/api/conversations/conversations.hook';

export function useConversationSidebar() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: conversations = [] } = useConversationsQuery();
  const deleteMutation = useDeleteConversationMutation();

  function selectConversation(id: string) {
    setSelectedId(id);
    setIsSidebarOpen(false);
  }

  function newChat() {
    setSelectedId(null);
    setIsSidebarOpen(false);
  }

  // Called when a message sent with no conversationId creates a new one
  // mid-turn - only adopts it if the user hasn't since navigated away
  // (matches the previous `current ?? id` guard).
  function adoptConversationId(id: string) {
    setSelectedId((current) => current ?? id);
  }

  function requestDelete(id: string) {
    setPendingDeleteId(id);
  }

  function cancelDelete() {
    setPendingDeleteId(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) {
      return;
    }
    const id = pendingDeleteId;
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedId === id) {
        newChat();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete conversation');
    } finally {
      setPendingDeleteId(null);
    }
  }

  return {
    conversations,
    selectedId,
    isSidebarOpen,
    setIsSidebarOpen,
    selectConversation,
    newChat,
    adoptConversationId,
    pendingDeleteId,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}
