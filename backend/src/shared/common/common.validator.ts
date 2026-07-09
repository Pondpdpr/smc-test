import Big from 'big.js';
import { isNullish } from 'remeda';
import { validate as UuidValidate } from 'uuid';

import type { Nilable } from '../type/type.common';

export const isUuid = UuidValidate;

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isDefined<T>(value: T | undefined): value is T {
  return !isUndefined(value);
}

export function isNull(value: any) {
  return isNullish(value);
}

export function isNil(value: Nilable): value is null | undefined {
  if (value === undefined) {
    return true;
  }

  if (value === null) {
    return true;
  }

  if (value === '') {
    return true;
  }

  return false;
}

export function isCsvNil(value: Nilable): value is null | undefined {
  if (value === '-') {
    return true;
  }

  return isNil(value);
}

export function isNotNil(value: Nilable) {
  return !isNil(value);
}

export function isPositiveDecimalFn(scale: number) {
  return (v: string) => isPositiveDecimal(v, scale);
}

export function isEnumFn<const T extends string>(items: readonly T[]) {
  const set = new Set(items);
  return (v: string[]): v is T[] => {
    return v.every((data) => set.has(data as T));
  };
}

export function isNumericString(value: string | null): boolean {
  if (isNil(value)) {
    return false;
  }

  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

export function isEmail(value: string | null): boolean {
  if (isNil(value)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isISOString(value: string | null): boolean {
  if (isNil(value)) {
    return false;
  }

  try {
    new Date(value);
    return true;
  } catch {
    return false;
  }
}

// helper

function isPositiveDecimal(input: string, scale: number): boolean {
  try {
    const big = new Big(input);

    if (big.lte(0)) return false;

    const [, fraction = ''] = input.split('.');
    return fraction.length === scale;
  } catch {
    return false;
  }
}

export function isValidCursorObject(o: { cursor?: string; sort?: any }) {
  if (o.cursor && o.sort) {
    return false;
  }

  return true;
}
