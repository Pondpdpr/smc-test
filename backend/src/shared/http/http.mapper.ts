import type { SetOptional } from 'type-fest';

import type {
  IStandardResponse,
  IStandardResponseWithMeta,
} from '../type/type.http';

export function toHttpSuccess<
  D extends object | object[],
  M extends object,
>(opts: { data: D; meta: M }): IStandardResponseWithMeta<D, M>;
export function toHttpSuccess<D extends object | object[]>(opts: {
  data: D;
}): IStandardResponse<D>;
export function toHttpSuccess<
  D extends object | object[],
  M extends object,
>(opts: {
  data: D;
  meta?: M;
}): SetOptional<IStandardResponseWithMeta<D, M>, 'meta'> {
  return {
    success: true,
    key: '',
    meta: opts.meta,
    data: opts.data,
  };
}
