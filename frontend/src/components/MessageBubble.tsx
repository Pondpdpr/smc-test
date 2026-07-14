import { isValidElement, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  FinancialChart,
  isChartDataGrounded,
  normalizeChartSpec,
  type ChartSpec,
} from '@/components/FinancialChart';
import { ToolCallCard } from '@/components/ToolCallCard';
import { cn } from '@/shared/lib/utils';
import type { ToolCall } from '@/shared/domain/message.domain';

// Intercepts ```chart fenced code blocks (see chat.constant.ts's SYSTEM_PROMPT)
// and renders them as a chart; renders nothing if malformed or ungrounded.
function buildMarkdownComponents(validNumbers: Set<number>): Components {
  return {
    code({ className, children, ...props }) {
      if (className?.includes('language-chart')) {
        const raw = String(children).replace(/\n$/, '');
        try {
          const parsed = JSON.parse(raw) as ChartSpec;
          if (parsed && Array.isArray(parsed.series) && Array.isArray(parsed.data)) {
            const spec = normalizeChartSpec(parsed);
            if (spec && isChartDataGrounded(spec, validNumbers)) {
              return <FinancialChart spec={spec} />;
            }
          }
          return null;
        } catch {
          // malformed JSON - fall through to the default code block below
        }
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // `prose` styles <pre> with a dark code-editor background - skip it for
    // charts. `children` is the unresolved <code> element, so check its
    // className prop directly rather than what it renders as.
    pre({ children, ...props }) {
      const child = Array.isArray(children) ? children[0] : children;
      const codeClassName = isValidElement<{ className?: string }>(child)
        ? child.props.className
        : undefined;
      if (codeClassName?.includes('language-chart')) {
        return <>{children}</>;
      }
      return <pre {...props}>{children}</pre>;
    },
  };
}

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[] | null;
  stopped?: boolean;
  pendingToolSql?: string | null;
};

export function MessageBubble({ role, content, toolCalls, stopped, pendingToolSql }: MessageBubbleProps) {
  const isUser = role === 'user';

  const validNumbers = useMemo(() => {
    const numbers = new Set<number>();
    toolCalls?.forEach((toolCall) => {
      toolCall.rows.forEach((row) => {
        Object.values(row).forEach((value) => {
          // bigint columns come back as numeric strings, not JS numbers.
          if (typeof value === 'number') {
            numbers.add(value);
          } else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
            numbers.add(Number(value));
          }
        });
      });
    });
    return numbers;
  }, [toolCalls]);

  const markdownComponents = useMemo(() => buildMarkdownComponents(validNumbers), [validNumbers]);

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
              // overflow-x-auto: wide tables scroll instead of bleeding past the bubble.
              <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto prose-p:my-1.5 prose-table:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {stopped && <span className="text-xs text-muted-foreground">Stopped</span>}
      </div>
    </div>
  );
}
