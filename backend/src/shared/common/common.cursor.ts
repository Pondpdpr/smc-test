import type { ValueOf } from 'type-fest';

import type { CursorObj, ParsedSort } from '../type/type.common';
import { encodeCursor } from './common.crypto';

export function overrideQueryWithCursor(
  query: {
    filter?: Record<string, unknown>;
    sort?: ParsedSort<string>;
  },
  cursor: CursorObj<string, Record<string, unknown> | undefined>,
) {
  query.filter = {
    ...query.filter,
    ...cursor.filter,
  };

  query.sort = cursor.sort;
}
type CursorMapper<Item, K extends string, F extends object> = {
  [S in K]: {
    /** Extract the value from an item for this sort key */
    get: (row: Item) => ValueOf<Item>;
    /** Use this filter field when dir === 'asc' (e.g., *_Gte) */
    asc: keyof F;
    /** Use this filter field when dir === 'desc' (e.g., *_Lte) */
    desc: keyof F;
  };
};

export function buildNextCursor<
  Item extends object[],
  K extends string,
  F extends object,
>(
  data: Item,
  sort: ParsedSort<K> | undefined,
  mapper: Readonly<CursorMapper<Item[number], K, F>>,
): string | null {
  if (!data.length || !sort?.length) return null;

  const last = data[data.length - 1];
  const filter = {} as Partial<F>;

  for (const [key, dir] of sort) {
    const spec = mapper[key];
    if (!spec) continue;
    const v = spec.get(last);
    const field = (dir === 'asc' ? spec.asc : spec.desc) as keyof F;
    (filter as any)[field] = v;
  }

  return encodeCursor({ sort, filter });
}
