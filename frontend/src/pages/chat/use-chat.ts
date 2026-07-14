import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { streamChat } from '@/shared/api/chat/chat.api';
import { chatQueryKeys, useStopChatMutation, useUsageQuery } from '@/shared/api/chat/chat.hook';
import {
  conversationsQueryKeys,
  useMessagesQuery,
} from '@/shared/api/conversations/conversations.hook';
import { ApiError } from '@/shared/lib/api-client';
import type { Message, ToolCall } from '@/shared/domain/message.domain';

// conversationId is owned by use-conversation-sidebar.ts, not this hook.
export function useChat(conversationId: string | null, onConversationCreated: (id: string) => void) {
  const queryClient = useQueryClient();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // Not in the query cache - shown until the post-turn invalidation clears it, so it never flickers.
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<Message | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([]);
  const [pendingToolSql, setPendingToolSql] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  // Which conversation the in-flight stream belongs to - stops a background reply
  // from rendering under whatever conversation is now selected.
  const streamingConversationIdRef = useRef<string | null>(null);

  const { data: messages = [] } = useMessagesQuery(conversationId);
  const { data: usage } = useUsageQuery();
  const stopChatMutation = useStopChatMutation();

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, streamingToolCalls, pendingToolSql]);

  // useMessagesQuery flips on mid-turn for a new conversation and can duplicate the
  // optimistic bubble - clear it as soon as the real list's tail matches.
  useEffect(() => {
    if (!optimisticUserMessage) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.role === 'user' && last.content === optimisticUserMessage.content) {
      setOptimisticUserMessage(null);
    }
  }, [messages, optimisticUserMessage]);

  // Called on conversation switch - clears the previous optimistic bubble, which has no other trigger to disappear.
  function resetTurn() {
    setOptimisticUserMessage(null);
  }

  function stop() {
    // Targets whichever conversation is actually generating, not the one currently selected - they can differ.
    const targetId = streamingConversationIdRef.current;
    if (targetId) {
      stopChatMutation.mutate(targetId);
    }
    abortControllerRef.current?.abort();
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      return;
    }
    if (isStreaming) {
      // Only one turn can run at a time - if it belongs to another conversation, say so instead of silently no-oping.
      if (streamingConversationIdRef.current !== conversationId) {
        toast.error("Still replying in another conversation - wait for it to finish first.");
      }
      return;
    }

    setInput('');
    setOptimisticUserMessage({
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content: text,
      toolCalls: null,
      stopped: false,
      createdAt: new Date().toISOString(),
    });
    setIsStreaming(true);
    setStreamingText('');
    setStreamingToolCalls([]);
    setPendingToolSql(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    streamingConversationIdRef.current = conversationId;

    let activeConversationId = conversationId ?? undefined;
    let pendingSql: string | null = null;
    const wasNewConversation = !conversationId;

    try {
      await streamChat(
        { conversationId: activeConversationId, message: text },
        (event) => {
          switch (event.event) {
            case 'conversation':
              activeConversationId = event.data.conversationId;
              streamingConversationIdRef.current = event.data.conversationId;
              onConversationCreated(event.data.conversationId);
              // Sidebar list has never seen this id - refresh now or the generating-indicator won't appear until the turn finishes.
              if (wasNewConversation) {
                queryClient.invalidateQueries({ queryKey: conversationsQueryKeys.list() });
              }
              break;
            case 'tool_call':
              pendingSql = event.data.sql;
              setPendingToolSql(event.data.sql);
              break;
            case 'tool_result':
              setStreamingToolCalls((prev) => [
                ...prev,
                { sql: pendingSql ?? '', rows: event.data.rows },
              ]);
              setPendingToolSql(null);
              pendingSql = null;
              break;
            case 'token':
              setStreamingText((prev) => prev + event.data.delta);
              break;
            case 'error':
              toast.error(event.data.message);
              break;
            case 'done':
              break;
          }
        },
        controller.signal,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // user-initiated stop, not a real error
      } else if (error instanceof ApiError && error.key === 'usageLimitExceeded') {
        toast.error(
          "You've reached your spending limit for this period. It resets automatically - try again later.",
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Something went wrong');
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setStreamingToolCalls([]);
      setPendingToolSql(null);
      abortControllerRef.current = null;
      streamingConversationIdRef.current = null;

      // Re-fetch rather than trust local streamed state, so partial/stopped/errored turns match
      // what's persisted; clear the optimistic bubble only once that lands, to avoid a flicker.
      if (activeConversationId) {
        queryClient
          .invalidateQueries({ queryKey: conversationsQueryKeys.messages(activeConversationId) })
          .then(() => setOptimisticUserMessage(null));
        if (wasNewConversation) {
          queryClient.invalidateQueries({ queryKey: conversationsQueryKeys.list() });
        }
      } else {
        setOptimisticUserMessage(null);
      }
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.usage() });
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as FormEvent);
    }
  }

  // Gated to the viewed conversation - raw isStreaming is true app-wide during any turn,
  // but content must only show under its own conversation.
  const isStreamingHere = isStreaming && streamingConversationIdRef.current === conversationId;
  const hasContent = messages.length > 0 || isStreamingHere || !!optimisticUserMessage;
  // Only one conversation can generate at a time, so its id alone drives the sidebar
  // indicator - read at render time, not stored in its own state.
  const generatingConversationId = isStreaming ? streamingConversationIdRef.current : null;

  return {
    messages,
    usage,
    input,
    setInput,
    generatingConversationId,
    // Drives the composer's disabled/Stop-vs-Send state - intentionally raw/ungated, since
    // only one turn can run at a time regardless of which conversation is viewed.
    isStreaming,
    optimisticUserMessage,
    streamingText: isStreamingHere ? streamingText : '',
    streamingToolCalls: isStreamingHere ? streamingToolCalls : [],
    pendingToolSql: isStreamingHere ? pendingToolSql : null,
    isStreamingHere,
    hasContent,
    sendMessage,
    stop,
    handleKeyDown,
    resetTurn,
    scrollBottomRef,
  };
}
