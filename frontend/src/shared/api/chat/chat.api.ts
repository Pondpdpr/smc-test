import {
  API_BASE_URL,
  ApiError,
  api,
  getDeviceId,
  getToken,
  handleFatalResponseStatus,
  refreshAccessToken,
} from '@/shared/lib/api-client';
import { apiPaths } from '@/shared/lib/api-paths';
import type { IStandardResponse } from '@/shared/lib/type.http';

import type { ChatStreamEvent, StopChatResult, Usage } from './chat.type';

function streamRequest(params: { conversationId?: string; message: string }, signal?: AbortSignal) {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('x-device', getDeviceId());
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Unlike axios's `client`, fetch() resolves a relative URL against the page's
  // own origin - it needs API_BASE_URL prefixed explicitly for a separate-host deploy.
  return fetch(`${API_BASE_URL}${apiPaths.chat.stream}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(params),
    signal,
  });
}

// Native EventSource can't POST a body, so the stream is parsed by hand off fetch() -
// `signal` abort is also how Stop works. Called directly from ChatPage, no hook.
export async function streamChat(
  params: { conversationId?: string; message: string },
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res = await streamRequest(params, signal);

  // Raw fetch bypasses the axios client's refresh-and-retry interceptor,
  // so it's reimplemented here for this one 401 case.
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await streamRequest(params, signal);
    }
  }

  if (!res.ok) {
    handleFatalResponseStatus(res.status);
    const body = await res.json().catch(() => null);
    const message = body?.error?.context?.message ?? body?.key ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, body?.key ?? 'unknown', message);
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

export async function stopChat(conversationId: string): Promise<IStandardResponse<StopChatResult>> {
  return api.post<StopChatResult>(apiPaths.chat.stop(conversationId));
}

export async function getUsage(): Promise<IStandardResponse<Usage>> {
  return api.get<Usage>(apiPaths.chat.usage);
}
