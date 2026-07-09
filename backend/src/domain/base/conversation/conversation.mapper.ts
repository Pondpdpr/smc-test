import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import { toDate, toResponseDate } from '@/shared/common/common.transformer';

import type {
  ConversationJson,
  ConversationPg,
  ConversationResponse,
} from './conversation.domain';
import { Conversation } from './conversation.domain';

export function conversationFromPg(data: ConversationPg): Conversation {
  const conversation: Conversation = {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    createdAt: toDate(data.created_at),
    updatedAt: toDate(data.updated_at),
  };
  return setPgState(conversation, data);
}

export function conversationFromJson(data: ConversationJson): Conversation {
  return {
    id: data.id,
    userId: data.userId,
    title: data.title,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    [$pgState]: getPgState(data),
  };
}

export function conversationToPg(data: Conversation): ConversationPg {
  return {
    id: data.id,
    user_id: data.userId,
    title: data.title,
    created_at: data.createdAt.toISOString(),
    updated_at: data.updatedAt.toISOString(),
  };
}

export function conversationToResponse(
  data: Conversation,
): ConversationResponse {
  return {
    id: data.id,
    title: data.title,
    createdAt: toResponseDate(data.createdAt),
    updatedAt: toResponseDate(data.updatedAt),
  };
}

export function conversationPgToResponse(
  data: ConversationPg,
): ConversationResponse {
  return {
    id: data.id,
    title: data.title,
    createdAt: toResponseDate(data.created_at),
    updatedAt: toResponseDate(data.updated_at),
  };
}

export function conversationToJson(data: Conversation): ConversationJson {
  return {
    id: data.id,
    userId: data.userId,
    title: data.title,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    [$pgState]: getPgState(data),
  };
}
