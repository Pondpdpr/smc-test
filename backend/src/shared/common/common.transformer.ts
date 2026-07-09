import Big from 'big.js';
import type { ConfigType } from 'dayjs';

import { ApiException } from '../http/http.exception';
import myDayjs from './common.dayjs';

export function toString(v: string | number) {
  return String(v);
}

export function toSet<T>(arr: T[]) {
  return new Set<T>(arr);
}

export function toOptionalSet<T>(arr: T[]) {
  if (!arr || !arr.length) {
    return undefined;
  }

  return new Set<T>(arr);
}

export function toBig(v: string) {
  return Big(v);
}

export function toOptionalBig(v?: string) {
  if (!v) {
    return;
  }

  return toBig(v);
}

export function toDate(date: ConfigType): Date;
export function toDate(date: ConfigType | null) {
  if (!date) {
    return null;
  }

  return myDayjs(date).toDate();
}

export function toISO(date: ConfigType): string;
export function toISO(date: ConfigType | null) {
  if (!date) {
    return null;
  }

  return myDayjs(date).toISOString();
}

export function toResponseDate(date: Date | string): string;
export function toResponseDate(date: Date | string | null): string | null;
export function toResponseDate(date: Date | string | null): string | null {
  if (!date) {
    return null;
  }

  return myDayjs(date).toISOString();
}

export function toSplitCommaArray(v: string) {
  return v.split(',');
}

export function toSplitCommaArrayOrThrow(v: unknown) {
  if (!v) {
    return [];
  }

  if (typeof v !== 'string') {
    throw new ApiException(500, 'toSplitCommaArrayOrThrow');
  }

  return toSplitCommaArray(v);
}

export function toBool(v?: string) {
  return v === 'true';
}

export function toOptionalBool(v?: string) {
  if (!v) {
    return undefined;
  }

  return v === 'true';
}

export function toNumber(v?: string) {
  if (!v) {
    return 0;
  }

  return Number(v);
}

export function toOptionalNumber(v?: string) {
  if (!v) {
    return undefined;
  }

  return toNumber(v);
}
