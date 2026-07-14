import { MenuIcon, SendIcon, SquareIcon } from 'lucide-react';

import { MessageBubble } from '@/components/MessageBubble';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UsageBadge } from '@/components/UsageBadge';

import { useChat } from './use-chat';
import { useConversationSidebar } from './use-conversation-sidebar';

export function ChatPage() {
  const sidebar = useConversationSidebar();
  const chat = useChat(sidebar.selectedId, sidebar.adoptConversationId);

  // The previous conversation's in-flight optimistic bubble has no other
  // trigger to clear once the user explicitly navigates away from it.
  function handleSelectConversation(id: string) {
    sidebar.selectConversation(id);
    chat.resetTurn();
  }

  function handleNewChat() {
    sidebar.newChat();
    chat.resetTurn();
  }

  return (
    <div className="flex h-svh">
      <Sidebar
        conversations={sidebar.conversations}
        selectedId={sidebar.selectedId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={sidebar.requestDelete}
        open={sidebar.isSidebarOpen}
        onOpenChange={sidebar.setIsSidebarOpen}
        pendingDeleteId={sidebar.pendingDeleteId}
        onCancelDelete={sidebar.cancelDelete}
        onConfirmDelete={sidebar.confirmDelete}
        isDeleting={sidebar.isDeleting}
        generatingConversationId={chat.generatingConversationId}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => sidebar.setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="size-4" />
            </Button>
            <h1 className="truncate text-sm font-medium text-muted-foreground">
              {sidebar.selectedId
                ? sidebar.conversations.find((c) => c.id === sidebar.selectedId)?.title
                : 'New conversation'}
            </h1>
          </div>
          <UsageBadge usage={chat.usage ?? null} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {!chat.hasContent && (
              <div className="flex flex-col items-center gap-2 py-24 text-center text-muted-foreground">
                <p className="text-lg font-medium">Ask about a company&apos;s financials</p>
                <p className="text-sm">
                  e.g. &quot;What was Apple&apos;s net income in 2023?&quot; - grounded in 48 US
                  companies, 2022-2025.
                </p>
              </div>
            )}

            {chat.messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                toolCalls={message.toolCalls}
                stopped={message.stopped}
              />
            ))}

            {chat.optimisticUserMessage && (
              <MessageBubble
                key={chat.optimisticUserMessage.id}
                role="user"
                content={chat.optimisticUserMessage.content}
                toolCalls={null}
                stopped={false}
              />
            )}

            {chat.isStreamingHere && (
              <MessageBubble
                role="assistant"
                content={chat.streamingText}
                toolCalls={chat.streamingToolCalls}
                pendingToolSql={chat.pendingToolSql}
              />
            )}

            <div ref={chat.scrollBottomRef} />
          </div>
        </div>

        <form onSubmit={chat.sendMessage} className="border-t p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Textarea
              value={chat.input}
              onChange={(e) => chat.setInput(e.target.value)}
              onKeyDown={chat.handleKeyDown}
              placeholder="Ask about revenue, net income…"
              rows={1}
              className="max-h-40 min-h-10 flex-1 resize-none"
              disabled={chat.isStreaming}
            />
            {chat.isStreaming ? (
              <Button type="button" variant="secondary" onClick={chat.stop} className="gap-1.5">
                <SquareIcon className="size-3.5 fill-current" />
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!chat.input.trim()} className="gap-1.5">
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
