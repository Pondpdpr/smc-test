import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuIcon, SendIcon, SquareIcon } from 'lucide-react';
import { toast } from 'sonner';

import { getUsage, stopChat, streamChat } from '@/api/chat';
import { deleteConversation, getMessages, listConversations } from '@/api/conversations';
import { MessageBubble } from '@/components/MessageBubble';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UsageBadge } from '@/components/UsageBadge';
import { queryKeys } from '@/lib/query-keys';
import type { Message, ToolCall } from '@/lib/types';

export function ChatPage() {
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // Not part of the messages query cache - shown alongside it until the
  // post-turn invalidation below resolves with the persisted version, so
  // the bubble never disappears then reappears.
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<Message | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([]);
  const [pendingToolSql, setPendingToolSql] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: listConversations,
  });

  const { data: usage } = useQuery({
    queryKey: queryKeys.usage(),
    queryFn: getUsage,
  });

  const { data: messages = [] } = useQuery({
    queryKey: queryKeys.conversations.messages(selectedId ?? ''),
    queryFn: () => getMessages(selectedId!),
    enabled: !!selectedId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });
      if (selectedId === id) {
        handleNewChat();
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not delete conversation');
    },
  });

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, streamingToolCalls, pendingToolSql]);

  function handleSelectConversation(id: string) {
    setSelectedId(id);
    setOptimisticUserMessage(null);
  }

  function handleNewChat() {
    setSelectedId(null);
    setOptimisticUserMessage(null);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // onError above already surfaced a toast
    }
  }

  function handleStop() {
    if (selectedId) {
      stopChat(selectedId).catch(() => {});
    }
    abortControllerRef.current?.abort();
  }

  async function handleSend(e: FormEvent) {
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

    let activeConversationId = selectedId ?? undefined;
    let pendingSql: string | null = null;
    const wasNewConversation = !selectedId;

    try {
      await streamChat(
        { conversationId: activeConversationId, message: text },
        (event) => {
          switch (event.event) {
            case 'conversation':
              activeConversationId = event.data.conversationId;
              setSelectedId((current) => current ?? event.data.conversationId);
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
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error(error instanceof Error ? error.message : 'Something went wrong');
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setStreamingToolCalls([]);
      setPendingToolSql(null);
      abortControllerRef.current = null;

      // Re-fetch from the backend rather than trusting our own streamed
      // state, so what's shown always matches what was actually persisted
      // (including partial/stopped/errored turns). Only clear the
      // optimistic bubble once that refetch actually lands, so it never
      // has a chance to flicker away and back.
      if (activeConversationId) {
        queryClient
          .invalidateQueries({ queryKey: queryKeys.conversations.messages(activeConversationId) })
          .then(() => setOptimisticUserMessage(null));
        if (wasNewConversation) {
          queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list() });
        }
      } else {
        setOptimisticUserMessage(null);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.usage() });
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  }

  const hasContent = messages.length > 0 || isStreaming || !!optimisticUserMessage;

  return (
    <div className="flex h-svh">
      <Sidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="size-4" />
            </Button>
            <h1 className="truncate text-sm font-medium text-muted-foreground">
              {selectedId
                ? conversations.find((c) => c.id === selectedId)?.title
                : 'New conversation'}
            </h1>
          </div>
          <UsageBadge usage={usage ?? null} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {!hasContent && (
              <div className="flex flex-col items-center gap-2 py-24 text-center text-muted-foreground">
                <p className="text-lg font-medium">Ask about a company&apos;s financials</p>
                <p className="text-sm">
                  e.g. &quot;What was Apple&apos;s net income in 2023?&quot; - grounded in 48 US
                  companies, 2022-2025.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                toolCalls={message.toolCalls}
                stopped={message.stopped}
              />
            ))}

            {optimisticUserMessage && (
              <MessageBubble
                key={optimisticUserMessage.id}
                role="user"
                content={optimisticUserMessage.content}
                toolCalls={null}
                stopped={false}
              />
            )}

            {isStreaming && (
              <MessageBubble
                role="assistant"
                content={streamingText}
                toolCalls={streamingToolCalls}
                pendingToolSql={pendingToolSql}
              />
            )}

            <div ref={scrollBottomRef} />
          </div>
        </div>

        <form onSubmit={handleSend} className="border-t p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about revenue, net income…"
              rows={1}
              className="max-h-40 min-h-10 flex-1 resize-none"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button type="button" variant="secondary" onClick={handleStop} className="gap-1.5">
                <SquareIcon className="size-3.5 fill-current" />
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()} className="gap-1.5">
                <SendIcon className="size-4" />
                Send
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
