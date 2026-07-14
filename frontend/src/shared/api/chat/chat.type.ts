export type Usage = {
  spendUsd: number;
  limitUsd: number;
  resetAt: string;
};

export type StopChatResult = {
  stopped: boolean;
};

// 'conversation' fires from the controller before the stream starts - every
// other variant comes from the streaming service itself.
export type ChatStreamEvent =
  | { event: 'conversation'; data: { conversationId: string } }
  | { event: 'tool_call'; data: { sql: string } }
  | { event: 'tool_result'; data: { rowCount: number; rows: Record<string, unknown>[] } }
  | { event: 'token'; data: { delta: string } }
  | { event: 'done'; data: { messageId: string; stopped: boolean; costUsd: number } }
  | { event: 'error'; data: { message: string } };
