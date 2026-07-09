import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import qs from 'qs';

import { config } from '@/infra/config';
import { KYSELY, runMigrations } from '@/infra/db/db.common';
import { pingDb } from '@/infra/db/db.util';
import { coreLogger } from '@/shared/common/common.logger';
import { CUSTOM_HEADERS } from '@/shared/http/http.headers';
import { setupApp } from '@/shared/http/http.setup';

import { AppApiModule } from './app/app.module';
import { isLocal } from './shared/common/common.func';

const appConfig = config().app;
const dbConfig = config().database;

async function bootstrap() {
  const app = await NestFactory.create(
    AppApiModule,
    new FastifyAdapter({
      routerOptions: {
        querystringParser: (str) => qs.parse(str),
      },
    }),
    {
      logger: coreLogger(appConfig),
      cors: {
        origin: appConfig.corsOrigin,
        methods: ['PATCH', 'HEAD', 'POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: [...CUSTOM_HEADERS, 'content-type'],
      },
    },
  );

  setupApp(app, appConfig);

  // Run migration
  const db = app.get(KYSELY);

  if (!isLocal(appConfig.nodeEnv)) {
    await pingDb(db);
  }
  if (dbConfig.enableAutoMigrate) {
    await runMigrations(db);
  }

  app.enableShutdownHooks();
  await app.listen(appConfig.apiPort, '0.0.0.0');
}
bootstrap();
