import { promises as fs } from 'fs';
import type {
  Expression,
  ExpressionBuilder,
  Kysely,
  OperandExpression,
  Selectable,
  SelectQueryBuilder,
  SqlBool,
  Transaction,
} from 'kysely';
import type { InsertObject, UpdateObject } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import * as path from 'path';
import type { Except } from 'type-fest';

import type { DB } from './db';

export const KYSELY = 'KYSELY';
export const READ_DB = Symbol('READ_DB');

export type CoreDB = Kysely<DB>;

type writeOperation =
  | 'deleteFrom'
  | 'updateTable'
  | 'insertInto'
  | 'replaceInto'
  | 'mergeInto';
export type ReadDB = Omit<CoreDB, writeOperation | 'transaction'>;
export type WriteDB = Except<CoreDB, 'selectFrom' | 'selectNoFrom'>;

export type TxDB = Transaction<DB>;
export type DBInsertData<T extends keyof DB> = InsertObject<DB, T>;
export type DBUpdateData<T extends keyof DB> = UpdateObject<DB, T, T>;
export type DBModel<T> = Selectable<T>;
export type Strict<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

export type EB<T extends keyof DB> = ExpressionBuilder<DB, T>;
export type EX<T> = Expression<T>;
export type SelectQB<T extends keyof DB> = SelectQueryBuilder<DB, T, object>;
export type WhereBuilder = OperandExpression<SqlBool>[];

export async function runMigrations(db: CoreDB) {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  return migrator.migrateToLatest();
}
