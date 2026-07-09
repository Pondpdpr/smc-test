import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import {
  toDate,
  toISO,
  toResponseDate,
} from '@/shared/common/common.transformer';

import type {
  MessageTaskJson,
  MessageTaskPg,
  MessageTaskResponse,
} from './message-task.domain';
import { MessageTask } from './message-task.domain';

export function messageTaskFromPg(pg: MessageTaskPg): MessageTask {
  const mt: MessageTask = {
    id: pg.id,
    createdAt: toDate(pg.created_at),
    updatedAt: toDate(pg.updated_at),
    queueName: pg.queue_name,
    exchangeName: pg.exchange_name,
    payload: pg.payload as Record<string, any>,
    messageStatus: pg.message_status,
    attempts: pg.attempts,
    maxAttempts: pg.max_attempts,
    lastError: pg.last_error,
    expireAt: toDate(pg.expire_at),
  };
  return setPgState(mt, pg);
}

export function messageTaskFromJson(data: MessageTaskJson): MessageTask {
  return {
    id: data.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    queueName: data.queueName,
    exchangeName: data.exchangeName,
    payload: data.payload,
    messageStatus: data.messageStatus,
    attempts: data.attempts,
    maxAttempts: data.maxAttempts,
    lastError: data.lastError,
    expireAt: toDate(data.expireAt),
    [$pgState]: getPgState(data),
  };
}

export function messageTaskToPg(messageTask: MessageTask): MessageTaskPg {
  return {
    id: messageTask.id,
    created_at: toISO(messageTask.createdAt),
    updated_at: toISO(messageTask.updatedAt),
    queue_name: messageTask.queueName,
    exchange_name: messageTask.exchangeName,
    payload: messageTask.payload as any,
    message_status: messageTask.messageStatus,
    attempts: messageTask.attempts,
    max_attempts: messageTask.maxAttempts,
    last_error: messageTask.lastError,
    expire_at: toISO(messageTask.expireAt),
  };
}

export function messageTaskToResponse(
  messageTask: MessageTask,
): MessageTaskResponse {
  return {
    id: messageTask.id,
    createdAt: toResponseDate(messageTask.createdAt),
    updatedAt: toResponseDate(messageTask.updatedAt),
    queueName: messageTask.queueName,
    exchangeName: messageTask.exchangeName,
    payload: messageTask.payload,
    messageStatus: messageTask.messageStatus,
    attempts: messageTask.attempts,
    maxAttempts: messageTask.maxAttempts,
    lastError: messageTask.lastError,
    expireAt: toResponseDate(messageTask.expireAt),
  };
}

export function messageTaskPgToResponse(
  messageTask: MessageTaskPg,
): MessageTaskResponse {
  return {
    id: messageTask.id,
    createdAt: toResponseDate(messageTask.created_at),
    updatedAt: toResponseDate(messageTask.updated_at),
    queueName: messageTask.queue_name,
    exchangeName: messageTask.exchange_name,
    payload: messageTask.payload as Record<string, any>,
    messageStatus: messageTask.message_status,
    attempts: messageTask.attempts,
    maxAttempts: messageTask.max_attempts,
    lastError: messageTask.last_error,
    expireAt: toResponseDate(messageTask.expire_at),
  };
}

export function messageTaskToJson(messageTask: MessageTask): MessageTaskJson {
  return {
    id: messageTask.id,
    createdAt: toISO(messageTask.createdAt),
    updatedAt: toISO(messageTask.updatedAt),
    queueName: messageTask.queueName,
    exchangeName: messageTask.exchangeName,
    payload: messageTask.payload,
    messageStatus: messageTask.messageStatus,
    attempts: messageTask.attempts,
    maxAttempts: messageTask.maxAttempts,
    lastError: messageTask.lastError,
    expireAt: toISO(messageTask.expireAt),
    [$pgState]: getPgState(messageTask),
  };
}
