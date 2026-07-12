import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const TOKEN_STORAGE_KEY = 'auth.token';
const DEVICE_STORAGE_KEY = 'auth.deviceId';
export const USER_STORAGE_KEY = 'auth.user';

export class ApiError extends Error {
  status: number;
  key: string;

  constructor(status: number, key: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.key = key;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

// The backend ties sessions/refresh tokens to a device id (x-device header).
// A stable per-browser id is generated once and reused for every request.
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
  }
  return deviceId;
}

// 401 = every auth failure this backend produces (expired/invalid/missing
// token - see jwt.guard.ts and common.crypto.ts, there's no other 401 usage).
// Not recoverable by the current page, so every call site funnels through
// this instead of handling it locally.
export function handleFatalResponseStatus(status: number): void {
  if (status !== 401) {
    return;
  }
  setToken(null);
  localStorage.removeItem(USER_STORAGE_KEY);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  key?: string;
  data?: T;
  error?: { context?: { message?: string } };
};

type RequestOptions = { headers?: Record<string, string> };

const client = axios.create({
  withCredentials: true, // carries the refresh-token cookie
});

// Content-Type is left for axios to set itself - it only adds
// application/json when there's an actual `data` payload, which is what
// fetch required doing by hand (Fastify's JSON body parser rejects an empty
// body if the header is present with no body, breaking DELETE/GET).
client.interceptors.request.use((config) => {
  config.headers.set('x-device', getDeviceId());
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

function toApiError(status: number, json: ApiEnvelope<unknown> | null | undefined): ApiError {
  const message = json?.error?.context?.message ?? json?.key ?? `Request failed (${status})`;
  return new ApiError(status, json?.key ?? 'unknown', message);
}

async function request<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const res = await client.request<ApiEnvelope<T>>({ url: path, ...config });
    if (!res.data?.success) {
      handleFatalResponseStatus(res.status);
      throw toApiError(res.status, res.data);
    }
    return res.data.data as T;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0;
      handleFatalResponseStatus(status);
      throw toApiError(status, error.response?.data as ApiEnvelope<unknown> | undefined);
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', data: body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
