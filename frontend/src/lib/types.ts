export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: string;
  emailVerifiedAt: string | null;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ToolCall = {
  sql: string;
  rows: Record<string, unknown>[];
  error?: string;
};

export type ChatRole = 'user' | 'assistant';

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls: ToolCall[] | null;
  stopped: boolean;
  createdAt: string;
};

export type Usage = {
  spendUsd: number;
  limitUsd: number;
  resetAt: string;
};
