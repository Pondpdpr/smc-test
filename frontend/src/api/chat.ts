import { api, getDeviceId, getToken, handleFatalResponseStatus } from '@/lib/api-client';
import { apiPaths } from '@/lib/api-paths';
import type { Usage } from '@/lib/types';

export type ChatStreamEvent =
  | { event: 'conversation'; data: { conversationId: string } }
  | { event: 'tool_call'; data: { sql: string } }
  | { event: 'tool_result'; data: { rowCount: number; rows: Record<string, unknown>[] } }
  | { event: 'token'; data: { delta: string } }
  | { event: 'done'; data: { messageId: string; stopped: boolean; costUsd: number } }
  | { event: 'error'; data: { message: string } };

// Native EventSource can't POST a body, so the SSE stream is parsed by hand
// off a fetch() ReadableStream instead. This is also what makes client-side
// Stop possible: aborting the fetch (via `signal`) tears down the connection.
export async function streamChat(
  params: { conversationId?: string; message: string },
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('x-device', getDeviceId());
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(apiPaths.chat.stream, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    handleFatalResponseStatus(res.status);
    const body = await res.json().catch(() => null);
    const message = body?.error?.context?.message ?? body?.key ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error('Streaming is not supported in this environment');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const parsed = parseSseEvent(rawEvent);
      if (parsed) {
        onEvent(parsed);
      }

      boundary = buffer.indexOf('\n\n');
    }
  }
}

function parseSseEvent(raw: string): ChatStreamEvent | null {
  let event = '';
  let data = '';

  for (const line of raw.split('\n')) {
    if (line.startsWith('event: ')) {
      event = line.slice('event: '.length);
    } else if (line.startsWith('data: ')) {
      data = line.slice('data: '.length);
    }
  }

  if (!event || !data) {
    return null;
  }

  try {
    return { event, data: JSON.parse(data) } as ChatStreamEvent;
  } catch {
    return null;
  }
}

export async function stopChat(conversationId: string) {
  await api.post(apiPaths.chat.stop(conversationId));
}

export async function getUsage() {
  return api.get<Usage>(apiPaths.chat.usage);
}
