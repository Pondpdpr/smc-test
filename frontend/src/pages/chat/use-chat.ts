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
  // Not in the query cache - shown until the post-turn invalidation below
  // resolves, so it never disappears then reappears.
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<Message | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([]);
  const [pendingToolSql, setPendingToolSql] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  const { data: messages = [] } = useMessagesQuery(conversationId);
  const { data: usage } = useUsageQuery();
  const stopChatMutation = useStopChatMutation();

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, streamingToolCalls, pendingToolSql]);

  // For a brand-new conversation, useMessagesQuery goes from disabled to
  // enabled mid-turn (as soon as the id is known), and the backend already
  // persisted the user message before streaming even started - so the
  // fetch that enabling triggers can surface it while the optimistic copy
  // is still showing too, duplicating the bubble for a few seconds until
  // the slower post-turn invalidation below catches up. Clearing as soon
  // as the real list's tail matches closes that window immediately instead
  // of waiting for the whole turn to finish.
  useEffect(() => {
    if (!optimisticUserMessage) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.role === 'user' && last.content === optimisticUserMessage.content) {
      setOptimisticUserMessage(null);
    }
  }, [messages, optimisticUserMessage]);

  // Called when the page switches conversations - clears the previous
  // one's in-flight bubble, which has no other trigger to disappear.
  function resetTurn() {
    setOptimisticUserMessage(null);
  }

  function stop() {
    if (conversationId) {
      stopChatMutation.mutate(conversationId);
    }
    abortControllerRef.current?.abort();
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) {
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
              onConversationCreated(event.data.conversationId);
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

      // Re-fetch rather than trust local streamed state, so partial/
      // stopped/errored turns match what's persisted. Clear the optimistic
      // bubble only once that lands, to avoid a flicker.
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

  const hasContent = messages.length > 0 || isStreaming || !!optimisticUserMessage;

  return {
    messages,
    usage,
    input,
    setInput,
    isStreaming,
    optimisticUserMessage,
    streamingText,
    streamingToolCalls,
    pendingToolSql,
    hasContent,
    sendMessage,
    stop,
    handleKeyDown,
    resetTurn,
    scrollBottomRef,
  };
}
