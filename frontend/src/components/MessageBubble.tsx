import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ToolCallCard } from '@/components/ToolCallCard';
import { cn } from '@/shared/lib/utils';
import type { ToolCall } from '@/shared/domain/message.domain';

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[] | null;
  stopped?: boolean;
  pendingToolSql?: string | null;
};

export function MessageBubble({ role, content, toolCalls, stopped, pendingToolSql }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[85%] flex-col gap-2', isUser && 'items-end')}>
        {toolCalls?.map((toolCall, i) => <ToolCallCard key={i} toolCall={toolCall} />)}
        {pendingToolSql && (
          <ToolCallCard toolCall={{ sql: pendingToolSql, rows: [] }} pending />
        )}
        {content && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              // overflow-x-auto: a markdown table's intrinsic width can
              // easily exceed the bubble's max-w-[85%] (e.g. 5+ currency
              // columns) - without this it just bleeds past the bubble's
              // rounded corners instead of scrolling within its own bounds.
              <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto prose-p:my-1.5 prose-table:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {stopped && <span className="text-xs text-muted-foreground">Stopped</span>}
      </div>
    </div>
  );
}
