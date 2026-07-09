import type { JsonValue } from '@/infra/db/db';
import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import { toDate, toResponseDate } from '@/shared/common/common.transformer';

import type {
  MessageJson,
  MessagePg,
  MessageResponse,
  MessageToolCall,
} from './message.domain';
import { Message } from './message.domain';

export function messageFromPg(data: MessagePg): Message {
  const message: Message = {
    id: data.id,
    conversationId: data.conversation_id,
    role: data.role,
    content: data.content,
    toolCalls: data.tool_call as MessageToolCall[] | null,
    stopped: data.stopped,
    costUsdMicros: data.cost_usd_micros,
    createdAt: toDate(data.created_at),
  };
  return setPgState(message, data);
}

export function messageFromJson(data: MessageJson): Message {
  return {
    id: data.id,
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    toolCalls: data.toolCalls,
    stopped: data.stopped,
    costUsdMicros: data.costUsdMicros,
    createdAt: toDate(data.createdAt),
    [$pgState]: getPgState(data),
  };
}

export function messageToPg(data: Message): MessagePg {
  return {
    id: data.id,
    conversation_id: data.conversationId,
    role: data.role,
    content: data.content,
    tool_call: data.toolCalls as JsonValue | null,
    stopped: data.stopped,
    cost_usd_micros: data.costUsdMicros,
    created_at: data.createdAt.toISOString(),
  };
}

export function messageToResponse(data: Message): MessageResponse {
  return {
    id: data.id,
    role: data.role,
    content: data.content,
    toolCalls: data.toolCalls,
    stopped: data.stopped,
    createdAt: toResponseDate(data.createdAt),
  };
}

export function messagePgToResponse(data: MessagePg): MessageResponse {
  return {
    id: data.id,
    role: data.role,
    content: data.content,
    toolCalls: data.tool_call as MessageToolCall[] | null,
    stopped: data.stopped,
    createdAt: toResponseDate(data.created_at),
  };
}

export function messageToJson(data: Message): MessageJson {
  return {
    id: data.id,
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    toolCalls: data.toolCalls,
    stopped: data.stopped,
    costUsdMicros: data.costUsdMicros,
    createdAt: data.createdAt.toISOString(),
    [$pgState]: getPgState(data),
  };
}
