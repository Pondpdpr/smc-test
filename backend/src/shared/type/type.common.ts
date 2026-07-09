import type duration from 'dayjs/plugin/duration';
import type { ReadonlyDeep, ReadonlyTuple, UnionToTuple } from 'type-fest';

import { $pgState } from '@/shared/common/common.domain';

export type Read<T> = ReadonlyDeep<T>;

export type Saved<T> = T & { id: number };

export type Nilable = unknown | undefined | null | string;

export type ObjectWithId = { id: number };

export type Info<K> = {
  key: K;
  context: Record<string, string>;
  fields: Record<string, any>;
};

export type Plain<T> = Omit<T, typeof $pgState>;

export type SortDir = 'asc' | 'desc';
export type ParsedSort<T extends string> = [T, SortDir][];

export type CursorObj<K extends string, T> = {
  filter: T;
  sort: ParsedSort<K>;
};

export type WithPgState<T, M> = {
  state: M | null;
  data: T;
};

export type AsyncReturn<T extends (...args: any) => any> = NonNullable<
  Awaited<ReturnType<T>>
>;

export type QueryInterface = {
  exec(...query: unknown[]): Promise<unknown>;
  getRaw(...query: unknown[]): Promise<unknown>;
};

export type CommandInterface = {
  exec(...body: unknown[]): Promise<unknown>;
  find?(...body: unknown[]): Promise<unknown>;
  save(...entity: unknown[]): Promise<void>;
};

export type DayjsDuration = duration.DurationUnitsObjectType;

export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K];
};

export type UnionArray<T extends string> = ReadonlyTuple<
  T,
  UnionToTuple<T>['length'] & number
>;
