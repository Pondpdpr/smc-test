import 'tsconfig-paths/register';

import { defineConfig } from 'kysely-ctl';

import { config } from '@/infra/config';
import getKysely from '@/infra/db/db.kysely';

export default defineConfig({
  kysely: getKysely(config().database),
  migrations: {
    migrationFolder: './src/infra/db/migrations',
  },
});
