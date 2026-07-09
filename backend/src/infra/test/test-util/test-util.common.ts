import type {
  DynamicModule,
  INestApplication,
  Provider,
  Type,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ControlledTransaction } from 'kysely';
import qs from 'qs';

import { AuthV1Module } from '@/app/api/v1/auth/auth.v1.module';
import { CliModule } from '@/app/cli/cli.module';
import { DomainModule } from '@/domain/domain.module';
import { config } from '@/infra/config';
import type { DB } from '@/infra/db/db';
import type { CoreDB } from '@/infra/db/db.common';
import { KYSELY } from '@/infra/db/db.common';
import { DBModule } from '@/infra/db/db.module';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { GlobalModule } from '@/infra/global/global.module';
import { MiddlewareModule } from '@/infra/middleware/middleware.module';
import { TEST_ACCOUNT_ID, TEST_USER_ID } from '@/shared/common/common.constant';
import { encodeUserJwt } from '@/shared/common/common.crypto';
import { getConfigOptions } from '@/shared/common/common.dotenv';
import { setupApp } from '@/shared/http/http.setup';

import { MockTransactionService } from '../mock/mock.trasaction.service';

export const TEST_DEVICE = 'supertest';

export async function createRepoTestingModule(repo: Provider) {
  const module = await Test.createTestingModule({
    providers: [
      repo,
      TransactionService,
      {
        provide: KYSELY,
        useFactory: async () => {
          return globalThis.dataSource;
        },
      },
    ],
  }).compile();

  return module;
}

export function createBackendTestingModule(
  testModule: DynamicModule | Type<any>,
): TestingModuleBuilder;
export function createBackendTestingModule(
  testModule: Array<DynamicModule | Type<any>>,
): TestingModuleBuilder;
export function createBackendTestingModule(
  testModule: DynamicModule | Type<any> | Array<DynamicModule | Type<any>>,
) {
  const testModules = Array.isArray(testModule) ? testModule : [testModule];

  const module = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot(getConfigOptions()),

      AuthV1Module,
      DBModule,
      GlobalModule,
      DomainModule,
      MiddlewareModule,
      CliModule,
      ...testModules,
    ],
  })
    .overrideProvider(TransactionService)
    .useClass(MockTransactionService);

  return module;
}

export async function startE2e(module: TestingModule) {
  const app = module.createNestApplication(
    new FastifyAdapter({
      routerOptions: {
        querystringParser: (str) => qs.parse(str),
      },
    }),
  );
  const appConfig = config().app;

  setupApp(app, appConfig);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

export async function stopE2e(app: INestApplication<any>) {
  await testTransactionRollback(app);
  await app.close();

  return;
}

export async function testTransactionStart(app: INestApplication<any>) {
  const transactionService = app.get(TransactionService);
  const db: CoreDB = app.get(KYSELY);

  const trx = await db.startTransaction().execute();
  transactionService.$setTransaction(trx);

  return;
}

export async function testTransactionRollback(app: INestApplication<any>) {
  const transactionService = app.get(TransactionService);
  const trx: ControlledTransaction<DB> = transactionService.$getTransaction();
  if (!trx) {
    return;
  }

  if (!trx.isRolledBack) {
    await trx.rollback().execute();
  }

  return;
}

export async function getBaseTestHeader(): Promise<Record<string, string>> {
  const token = encodeUserJwt({
    userId: TEST_USER_ID,
    accountId: TEST_ACCOUNT_ID,
  });

  return {
    authorization: `Bearer ${token}`,
  };
}
