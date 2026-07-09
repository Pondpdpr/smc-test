import type { Nilable } from '../type/type.common';
import { isCsvNil, isNil } from './common.validator';

export function parseNil<T extends Nilable>(val: T): T | null {
  if (isNil(val)) {
    return null;
  }

  return val;
}

export function parseCsvNil<T extends Nilable>(val: T): T | null {
  if (isCsvNil(val)) {
    return null;
  }

  return val;
}
