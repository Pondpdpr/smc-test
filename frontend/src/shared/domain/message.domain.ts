// Hand-typed, not a cross-package import - see the note in user.domain.ts.
export type ChatRole = 'user' | 'assistant';

export type ToolCall = {
  sql: string;
  rows: Record<string, unknown>[];
  error?: string;
};

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls: ToolCall[] | null;
  stopped: boolean;
  createdAt: string;
};
