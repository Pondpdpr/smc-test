import type { SelectQueryBuilder, StringReference } from 'kysely';
import { sql } from 'kysely';
import { DatabaseError } from 'pg';

import {
  getQueryPagination,
  PaginationQuery,
} from '@/shared/common/common.pagination';
import type { ParsedSort } from '@/shared/type/type.common';

import type { DB } from './db';
import type { CoreDB } from './db.common';

export async function queryCount(qb: SelectQueryBuilder<DB, any, any>) {
  const resp = await qb
    .clearSelect()
    .select(({ fn }) => fn.countAll().as('total'))
    .executeTakeFirst();

  if (!resp?.total) {
    return 0;
  }

  return parseInt(resp.total as string);
}

export async function queryExists(qb: SelectQueryBuilder<DB, any, any>) {
  const resp = await qb.clearSelect().select('id').executeTakeFirst();
  return !!resp?.id;
}

export function filterQbIds<DB, TB extends keyof DB & string, U>(
  ids: readonly string[],
  qb: SelectQueryBuilder<DB, TB, U>,
  ref: StringReference<DB, TB>,
): typeof qb {
  // Expand once, carry position
  const unnest = sql`unnest(${sql.val(ids)}::uuid[]) with ordinality as _ord(id, ord)`;

  return (
    qb
      .innerJoin(unnest as any, (j) => j.onRef(sql`_ord.id`, '=', ref as any))
      // @ts-expect-error complex solution for performance
      .orderBy(sql`_ord.ord`)
  );
}

type ColumnMap<DB, TB extends keyof DB & string, T extends string> = Record<
  T,
  StringReference<DB, TB>
>;
export function sortQb<DB, TB extends keyof DB & string, T extends string>(
  qb: SelectQueryBuilder<DB, TB, any>,
  sorts: ParsedSort<T> | undefined,
  mapper: Readonly<ColumnMap<DB, TB, T>>,
): SelectQueryBuilder<DB, TB, any> {
  sorts ??= [];

  let q = qb;
  for (const [key, dir] of sorts) {
    const col = mapper[key];
    if (!col) continue; // ignore unknown keys at runtime

    q = q.orderBy(col, dir);
  }
  return q;
}

export function addPagination<DB, TB extends keyof DB & string, U>(
  qb: SelectQueryBuilder<DB, TB, U>,
  pagination: PaginationQuery | undefined,
) {
  const { limit, offset } = getQueryPagination(pagination);

  return qb
    .$if(!!limit, (q) => q.limit(limit!))
    .$if(!!offset, (q) => q.offset(offset!));
}

export function getDbErrorKey(e: DatabaseError | unknown) {
  if (!(e instanceof DatabaseError)) {
    return 'internal';
  }

  switch (e.code) {
    case '23505': // unique_violation
      return 'exists';
    case '23503': // foreign_key_violation
      return 'invalidRef';
    default:
      return 'internal';
  }
}

export async function pingDb(db: CoreDB) {
  await sql`SELECT 1`.execute(db);
}
