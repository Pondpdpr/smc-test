import type { MessageStatus, MessageTasks } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

type MessageTaskPlain = {
  readonly id: string;
  readonly queueName: string;
  readonly exchangeName: string;
  payload: Record<string, any>;
  messageStatus: MessageStatus;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  readonly expireAt: Date;
};

export type MessageTaskPg = DBModel<MessageTasks>;
export type MessageTask = WithState<MessageTaskPg> & MessageTaskPlain;
export type MessageTaskJson = WithState<MessageTaskPg> &
  Serialized<MessageTaskPlain>;

export type MessageTaskResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
  expireAt: string;
  queueName: string;
  exchangeName: string | null;
  payload: Record<string, any>;
  messageStatus: MessageStatus;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
};

export type MessageTaskNewData = {
  id: string;
  queueName: string;
  exchangeName: string;
  payload: Record<string, any>;
  maxAttempts?: number;
  messageStatus?: MessageStatus;
};

export type MessageTaskUpdateData = {
  messageStatus?: MessageStatus;
  attempts?: number;
  lastError?: string | null;
};
