import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '@/infra/config';

import { KYSELY, READ_DB } from './db.common';
import getKysely from './db.kysely';

export const KyselyProvider: Provider = {
  provide: KYSELY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const dbconfig =
      configService.getOrThrow<AppConfig['database']>('database');
    return getKysely(dbconfig);
  },
};

export const ReplicaKyselyProvider: Provider = {
  provide: READ_DB,
  // change this to replica if needed
  useExisting: KYSELY,
};
