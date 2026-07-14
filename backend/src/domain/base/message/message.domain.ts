import type { MessageRole, Messages } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

// One visibly-rendered SQL tool call - a turn can trigger more than one
// (parallel tool calls), so messages store an array.
export type MessageToolCall = {
  sql: string;
  rows: Record<string, unknown>[];
  error?: string;
};

type MessagePlain = {
  readonly id: string;
  readonly conversationId: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly toolCalls: MessageToolCall[] | null;
  // True if generation was stopped mid-stream by the user (S3) - the partial
  // content is still persisted and still counted towards usage.
  readonly stopped: boolean;
  readonly costUsdMicros: string;
  readonly createdAt: Date;
};

export type MessagePg = DBModel<Messages>;
export type Message = WithState<MessagePg> & MessagePlain;
export type MessageJson = WithState<MessagePg> & Serialized<MessagePlain>;

export type MessageResponse = {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls: MessageToolCall[] | null;
  stopped: boolean;
  createdAt: string;
};

// Messages are append-only: no UpdateData/edit() - the final (or stopped)
// state is known up front when the message is persisted, see chat.service.ts.
export type MessageNewData = {
  conversationId: string;
  role: MessageRole;
  content: string;
  toolCalls?: MessageToolCall[] | null;
  stopped?: boolean;
  costUsdMicros?: string;
};
