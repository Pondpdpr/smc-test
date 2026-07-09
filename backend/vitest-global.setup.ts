import 'tsconfig-paths/register';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

import { mockTestAccount } from '@/domain/base/account/account.factory';
import { accountToPg } from '@/domain/base/account/account.mapper';
import { mockTestUser } from '@/domain/base/user/user.factory';
import { userToPg } from '@/domain/base/user/user.mapper';
import { KYSELY, runMigrations } from '@/infra/db/db.common';
import { MainDb } from '@/infra/db/db.main';
import { DBModule } from '@/infra/db/db.module';
import { getConfigOptions } from '@/shared/common/common.dotenv';

@Module({
  imports: [ConfigModule.forRoot(getConfigOptions()), DBModule],
})
class SetupModule {}

async function setupAppState() {
  const app = await NestFactory.create(SetupModule);
  await app.init();

  app.enableShutdownHooks();

  await runMigrations(app.get(KYSELY));

  const testUser = mockTestUser();
  const testAccount = mockTestAccount();

  await app
    .get(MainDb)
    .write.insertInto('accounts')
    .values(accountToPg(testAccount))
    .execute();

  await app
    .get(MainDb)
    .write.insertInto('users')
    .values(userToPg(testUser))
    .execute();

  await app.close();
}

export default async function setup(_project: TestProject) {
  // process.env.TESTCONTAINERS_HOST_OVERRIDE = '127.0.0.1';
  const pgContainer = await new PostgreSqlContainer('postgres:15').start();

  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  globalThis.pgContainer = pgContainer;

  await setupAppState();
}

export async function teardown() {
  if (globalThis.pgContainer) {
    await globalThis.pgContainer.stop();
  }
}
