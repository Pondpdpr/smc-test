import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { ConversationService } from '@/domain/base/conversation/conversation.service';
import { newConversation } from '@/domain/base/conversation/conversation.util';
import { Message, MessageToolCall } from '@/domain/base/message/message.domain';
import { MessageService } from '@/domain/base/message/message.service';
import { newMessage } from '@/domain/base/message/message.util';
import type { AppConfig } from '@/infra/config';
import { MainDb } from '@/infra/db/db.main';
import { OpenAiService } from '@/infra/global/openai/openai.service';
import { ApiException } from '@/shared/http/http.exception';

import {
  DEFAULT_MODEL_PRICING,
  MODEL_PRICING_USD_PER_MILLION_TOKENS,
  SYSTEM_PROMPT,
} from './chat.constant';
import { ChatStopService } from './chat-stop.service';
import {
  executeFinancialQuery,
  FINANCIAL_QUERY_TOOL_NAME,
  FinancialQueryArgs,
  financialQueryTool,
  renderFinancialQuerySql,
} from './financial-query.tool';
import { UsageService } from './usage.service';

// initial round + one continuation after tool results - bounds cost/latency
// even if the model tries to chain further tool calls.
const MAX_TOOL_CALL_ROUNDS = 2;
const MAX_TITLE_LENGTH = 60;

export type ChatStreamEvent =
  | { event: 'tool_call'; data: { sql: string } }
  | {
      event: 'tool_result';
      data: { rowCount: number; rows: Record<string, unknown>[] };
    }
  | { event: 'token'; data: { delta: string } }
  | {
      event: 'done';
      data: { messageId: string; stopped: boolean; costUsd: number };
    }
  | { event: 'error'; data: { message: string } };

type ToolCallBuffer = { id: string; name: string; arguments: string };
type TokenUsage = { prompt_tokens: number; completion_tokens: number };

@Injectable()
export class ChatService {
  constructor(
    private db: MainDb,
    private openAiService: OpenAiService,
    private configService: ConfigService,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private usageService: UsageService,
    private chatStopService: ChatStopService,
  ) {}

  // Validation + the user-message write that must happen BEFORE the SSE
  // stream opens, so a bad request still gets a normal HTTP error response
  // (404/429) instead of a half-opened stream - see chat.v1.controller.ts.
  async prepareTurn(
    userId: string,
    params: { conversationId?: string; message: string },
  ): Promise<{ conversationId: string }> {
    const hasBudget = await this.usageService.hasBudgetRemaining(userId);
    if (!hasBudget) {
      throw new ApiException(429, 'usageLimitExceeded');
    }

    const conversationId = await this._resolveConversation(userId, params);

    const userMessage = newMessage({
      conversationId,
      role: 'user',
      content: params.message,
    });
    await this.messageService.save(userMessage);

    return { conversationId };
  }

  async *streamAssistantReply(
    userId: string,
    conversationId: string,
  ): AsyncGenerator<ChatStreamEvent> {
    // Declared outside the try block so a mid-flight failure (e.g. OpenAI
    // erroring) can still persist whatever was accumulated so far, instead
    // of leaving the conversation with a dangling user question and no
    // reply at all - see the catch block below.
    let content = '';
    let stopped = false;
    let costUsd = 0;
    const allToolCalls: MessageToolCall[] = [];

    try {
      const history =
        await this.messageService.findByConversationId(conversationId);
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((m) => this._toOpenAiMessage(m)),
      ];

      for (let round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
        const isLastAllowedRound = round === MAX_TOOL_CALL_ROUNDS - 1;
        const tools = isLastAllowedRound ? [] : [financialQueryTool];

        const stream = await this.openAiService.streamChatCompletion(
          messages,
          tools,
        );

        const toolCallBuffers = new Map<number, ToolCallBuffer>();
        let roundContent = '';
        let gotUsage = false;

        for await (const chunk of stream) {
          if (await this.chatStopService.isStopRequested(conversationId)) {
            stopped = true;
            stream.controller.abort();
            break;
          }

          if (chunk.usage) {
            gotUsage = true;
            costUsd += this._computeCost(chunk.usage);
          }

          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            roundContent += delta.content;
            yield { event: 'token', data: { delta: delta.content } };
          }

          for (const toolCallDelta of delta?.tool_calls ?? []) {
            const existing = toolCallBuffers.get(toolCallDelta.index) ?? {
              id: '',
              name: '',
              arguments: '',
            };
            if (toolCallDelta.id) {
              existing.id = toolCallDelta.id;
            }
            if (toolCallDelta.function?.name) {
              existing.name += toolCallDelta.function.name;
            }
            if (toolCallDelta.function?.arguments) {
              existing.arguments += toolCallDelta.function.arguments;
            }
            toolCallBuffers.set(toolCallDelta.index, existing);
          }
        }

        content += roundContent;

        // Aborted mid-stream: we never got the final usage chunk, so
        // estimate cost from character counts rather than under-billing the
        // partial response to $0 (S3 requires cost still be deducted).
        if (!gotUsage) {
          costUsd += this._estimateCost(messages, roundContent);
        }

        if (stopped) {
          break;
        }

        if (toolCallBuffers.size === 0) {
          break; // model answered directly, no tool needed
        }

        const toolCalls = Array.from(toolCallBuffers.values());
        messages.push({
          role: 'assistant',
          content: roundContent || null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        for (const toolCall of toolCalls) {
          if (toolCall.name !== FINANCIAL_QUERY_TOOL_NAME) {
            continue;
          }

          const args = this._parseToolArgs(toolCall.arguments);
          const sqlText = renderFinancialQuerySql(this.db, args);
          yield { event: 'tool_call', data: { sql: sqlText } };

          const rows = await executeFinancialQuery(this.db, args);
          yield { event: 'tool_result', data: { rowCount: rows.length, rows } };

          allToolCalls.push({ sql: sqlText, rows });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: rows.length
              ? JSON.stringify(rows)
              : 'No rows found - this data is not available.',
          });
        }
      }

      const assistantMessage = await this._finalizeTurn(
        userId,
        conversationId,
        { content, stopped, costUsd, toolCalls: allToolCalls },
      );

      yield {
        event: 'done',
        data: { messageId: assistantMessage.id, stopped, costUsd },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong';

      // Still persist whatever was generated before the failure (and still
      // deduct its cost), so the conversation doesn't end up with a
      // dangling user question and no reply on reload.
      const noteworthyContent = content
        ? `${content}\n\n[Error: ${errorMessage}]`
        : `Sorry, something went wrong: ${errorMessage}`;

      await this._finalizeTurn(userId, conversationId, {
        content: noteworthyContent,
        stopped,
        costUsd,
        toolCalls: allToolCalls,
      });

      yield { event: 'error', data: { message: errorMessage } };
    }
  }

  private async _finalizeTurn(
    userId: string,
    conversationId: string,
    turn: {
      content: string;
      stopped: boolean;
      costUsd: number;
      toolCalls: MessageToolCall[];
    },
  ): Promise<Message> {
    const assistantMessage = newMessage({
      conversationId,
      role: 'assistant',
      content: turn.content,
      toolCalls: turn.toolCalls.length ? turn.toolCalls : null,
      stopped: turn.stopped,
      costUsdMicros: String(Math.round(turn.costUsd * 1_000_000)),
    });
    await this.messageService.save(assistantMessage);

    if (turn.costUsd > 0) {
      await this.usageService.recordCost(userId, turn.costUsd);
    }
    await this.chatStopService.clearStop(conversationId);

    return assistantMessage;
  }

  private async _resolveConversation(
    userId: string,
    params: { conversationId?: string; message: string },
  ): Promise<string> {
    if (!params.conversationId) {
      const conversation = newConversation({
        userId,
        title: this._deriveTitle(params.message),
      });
      await this.conversationService.save(conversation);
      return conversation.id;
    }

    const conversation = await this.conversationService.findOne(
      params.conversationId,
    );
    if (!conversation || conversation.userId !== userId) {
      throw new ApiException(404, 'conversationNotFound');
    }

    return conversation.id;
  }

  private _deriveTitle(message: string): string {
    const trimmed = message.trim();
    if (trimmed.length <= MAX_TITLE_LENGTH) {
      return trimmed;
    }
    return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1)}…`;
  }

  private _toOpenAiMessage(message: Message): ChatCompletionMessageParam {
    return message.role === 'user'
      ? { role: 'user', content: message.content }
      : { role: 'assistant', content: message.content };
  }

  private _parseToolArgs(rawArguments: string): FinancialQueryArgs {
    try {
      return JSON.parse(rawArguments || '{}');
    } catch {
      // Model produced invalid JSON - fall back to an unfiltered query
      // rather than failing the whole turn.
      return {};
    }
  }

  private _modelPricing() {
    const { model } =
      this.configService.getOrThrow<AppConfig['openai']>('openai');
    return MODEL_PRICING_USD_PER_MILLION_TOKENS[model] ?? DEFAULT_MODEL_PRICING;
  }

  private _computeCost(usage: TokenUsage): number {
    const pricing = this._modelPricing();
    return (
      (usage.prompt_tokens / 1_000_000) * pricing.prompt +
      (usage.completion_tokens / 1_000_000) * pricing.completion
    );
  }

  private _estimateCost(
    messages: ChatCompletionMessageParam[],
    roundContent: string,
  ): number {
    const promptChars = messages.reduce(
      (sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0),
      0,
    );
    // ~4 characters per token is a common rough estimate for English text.
    return this._computeCost({
      prompt_tokens: Math.ceil(promptChars / 4),
      completion_tokens: Math.ceil(roundContent.length / 4),
    });
  }
}
