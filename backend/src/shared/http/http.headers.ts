export const AUTH_HEADER = 'authorization';
export const LANG_HEADER = 'accept-language';
export const DEVICE_HEADER = 'x-device';
export const TRACE_ID_HEADER = 'trace-id';
export const IDEMPOTENCY_HEADER = 'idempotency-key';
export const FILE_FORMAT_HEADER = 'x-format';

export const CUSTOM_HEADERS = [
  AUTH_HEADER,
  LANG_HEADER,
  DEVICE_HEADER,
  TRACE_ID_HEADER,
  FILE_FORMAT_HEADER,
  IDEMPOTENCY_HEADER,
] as const;
