import chalk from 'chalk';
import { DeduplicateJoinsPlugin, Kysely, PostgresDialect } from 'kysely';
import path from 'path';
import * as pg from 'pg';

import type { AppConfig } from '../config';
import type { DB } from './db';

pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (val) => {
  return val === null ? null : new Date(val).toISOString();
});
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (val) => {
  return val === null ? null : new Date(val).toISOString();
});
pg.types.setTypeParser(pg.types.builtins.INT8, (val) => {
  return val === null ? null : String(val);
});

function interpolateSql(sql: string, params: readonly unknown[]): string {
  return sql.replace(/\$(\d+)/g, (_, index) => {
    const value = params[Number(index) - 1];
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return `'${String(value).replace(/'/g, "''")}'`; // escape single quotes
  });
}

export default function getKysely(dbConfig: AppConfig['database']) {
  const hasSslConfig = !!(dbConfig.sslCaPath || dbConfig.sslCertPath);
  const rootSrc = path.join(__dirname, '..', '..');

  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: dbConfig.url,
        ssl: hasSslConfig
          ? {
              cert: dbConfig.sslCertPath
                ? path.join(rootSrc, dbConfig.sslCertPath)
                : undefined,
              ca: dbConfig.sslCaPath
                ? path.join(rootSrc, dbConfig.sslCaPath)
                : undefined,
            }
          : undefined,
      }),
    }),
    log(event) {
      if (!dbConfig.enableLog) {
        return;
      }

      const rawSql = interpolateSql(event.query.sql, event.query.parameters);

      if (event.level === 'error') {
        console.error(
          '\n' +
            chalk.bold.red('Query failed: ') +
            rawSql +
            '\n' +
            chalk.bold.red((event.error as Error)['message'] || ''),
        );
      } else {
        console.log('\n' + chalk.bold.white('Query: ') + chalk.gray(rawSql));
      }
    },
    plugins: [new DeduplicateJoinsPlugin()],
  });
}
