import type { UnionToTuple } from 'type-fest';

import type { MessageStatus } from '@/infra/db/db';
import myDayjs from '@/shared/common/common.dayjs';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type {
  MessageTask,
  MessageTaskNewData,
  MessageTaskUpdateData,
} from './message-task.domain';

export const MessageStatusTuple: UnionToTuple<MessageStatus> = [
  'DEAD',
  'FAIL',
  'INVALID_PAYLOAD',
  'SUCCESS',
] as const;

export function newMessageTask(data: MessageTaskNewData): MessageTask {
  return {
    id: data.id,
    createdAt: myDayjs().toDate(),
    updatedAt: myDayjs().toDate(),
    queueName: data.queueName,
    exchangeName: data.exchangeName,
    payload: data.payload,
    messageStatus: valueOr(data.messageStatus, 'SUCCESS'),
    attempts: 1,
    maxAttempts: valueOr(data.maxAttempts, 5),
    expireAt: myDayjs().add(7, 'days').toDate(),
    lastError: null,
  };
}

export function newMessageTasks(data: MessageTaskNewData[]): MessageTask[] {
  return data.map((d) => newMessageTask(d));
}

export function editMessageTask(
  entity: MessageTask,
  data: MessageTaskUpdateData,
): MessageTask {
  return {
    [$pgState]: getPgState(entity),
    id: entity.id,
    queueName: entity.queueName,
    exchangeName: entity.exchangeName,
    createdAt: entity.createdAt,
    expireAt: entity.expireAt,
    payload: entity.payload,
    maxAttempts: entity.maxAttempts,

    // Update
    messageStatus: valueOr(data.messageStatus, entity.messageStatus),
    attempts: valueOr(data.attempts, entity.attempts),
    lastError: valueOr(data.lastError, entity.lastError),
    updatedAt: myDayjs().toDate(),
  };
}

export function startProcessMessageTask(
  entity: MessageTask,
  error?: string,
): MessageTask {
  return editMessageTask(entity, {
    attempts: entity.attempts + 1,
    messageStatus: 'SUCCESS',
    lastError: error || entity.lastError,
  });
}

export function markMessageTaskAsFailed(
  entity: MessageTask,
  error: string,
): MessageTask {
  return editMessageTask(entity, { messageStatus: 'FAIL', lastError: error });
}

export function markMessageTaskAsInvalid(
  entity: MessageTask,
  error: string,
): MessageTask {
  return editMessageTask(entity, {
    messageStatus: 'INVALID_PAYLOAD',
    lastError: error,
  });
}

export function markMessageTaskAsSuccess(entity: MessageTask): MessageTask {
  return editMessageTask(entity, {
    messageStatus: 'SUCCESS',
    lastError: null,
  });
}

export function markMessageTaskAsDead(
  entity: MessageTask,
  error?: string,
): MessageTask {
  return editMessageTask(entity, { messageStatus: 'DEAD', lastError: error });
}

export function isMessageTaskMaxAttemptsReached(entity: MessageTask): boolean {
  return entity.attempts >= entity.maxAttempts;
}
