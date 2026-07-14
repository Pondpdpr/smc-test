import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { apiPaths } from './api-paths';
import type { IStandardResponse } from './type.http';

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

// 401 = every auth failure this backend produces. Only reached after the
// response interceptor below already tried refreshAccessToken() and
// failed - this is the final fallback, not the first reaction to a 401.
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

// Loosely typed: backend's success/error shapes both use plain `boolean`
// for `success`, so they aren't a real discriminated union either.
type ApiEnvelope<T> = Partial<IStandardResponse<T & Record<string, any>>> & {
  error?: { context?: { message?: string } };
};

type RequestOptions = { headers?: Record<string, string> };

// Empty by default - relative `/v1/...` calls resolve against the current origin,
// which the dev/preview server proxies to the local backend (see vite.config.ts).
// Set VITE_API_URL when the frontend and backend are deployed on separate hosts.
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // carries the refresh-token cookie
});

// Axios only sets Content-Type when there's a `data` payload, avoiding the
// empty-body-with-header issue Fastify's parser rejects on DELETE/GET.
client.interceptors.request.use((config) => {
  config.headers.set('x-device', getDeviceId());
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Shared so concurrent 401s trigger one /refresh call, not one per request.
let refreshPromise: Promise<boolean> | null = null;

// Plain axios, not `client` - avoids recursing into the response
// interceptor below if refresh itself 401s.
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<IStandardResponse<{ token: string }>>(apiPaths.auth.refresh, undefined, {
        baseURL: API_BASE_URL,
        withCredentials: true,
        headers: { 'x-device': getDeviceId() },
      })
      .then((res) => {
        const token = res.data?.data?.token;
        if (!token) {
          return false;
        }
        setToken(token);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetryableConfig = AxiosRequestConfig & { _retried?: boolean };

// On 401, try the refresh cookie once before giving up - the JWT lasts 1h,
// the refresh cookie 7 days, so most 401s mid-session are recoverable.
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const isRefreshCall = config?.url === apiPaths.auth.refresh;

    if (error.response?.status === 401 && config && !config._retried && !isRefreshCall) {
      config._retried = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return client.request(config);
      }
    }

    return Promise.reject(error);
  },
);

function toApiError(status: number, json: ApiEnvelope<unknown> | null | undefined): ApiError {
  const message = json?.error?.context?.message ?? json?.key ?? `Request failed (${status})`;
  return new ApiError(status, json?.key ?? 'unknown', message);
}

// Returns the envelope as-is, matching backend's IStandardResponse<D> -
// callers unwrap `.data` themselves.
async function request<T extends Record<string, any>>(
  path: string,
  config: AxiosRequestConfig = {},
): Promise<IStandardResponse<T>> {
  try {
    const res = await client.request<ApiEnvelope<T>>({ url: path, ...config });
    if (!res.data?.success) {
      handleFatalResponseStatus(res.status);
      throw toApiError(res.status, res.data);
    }
    return res.data as IStandardResponse<T>;
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
  get: <T extends Record<string, any>>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T extends Record<string, any>>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', data: body }),
  delete: <T extends Record<string, any>>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
