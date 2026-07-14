import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useConversationsQuery,
  useDeleteConversationMutation,
} from '@/shared/api/conversations/conversations.hook';

// selectedId is the URL's :conversationId, not local state, so a page
// refresh stays on the same conversation instead of always resetting to
// the empty/new-chat view.
export function useConversationSidebar() {
  const { conversationId: selectedId = null } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: conversations = [] } = useConversationsQuery();
  const deleteMutation = useDeleteConversationMutation();

  function selectConversation(id: string) {
    navigate(`/c/${id}`);
    setIsSidebarOpen(false);
  }

  function newChat() {
    navigate('/');
    setIsSidebarOpen(false);
  }

  // Called when a message sent with no conversationId creates a new one
  // mid-turn - only adopts it if the user hasn't since navigated away
  // (matches the previous `current ?? id` guard). `replace` so streaming
  // into a fresh conversation doesn't add a spare back-button entry.
  function adoptConversationId(id: string) {
    if (!selectedId) {
      navigate(`/c/${id}`, { replace: true });
    }
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
