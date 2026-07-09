import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { DomainModule } from '@/domain/domain.module';
import { DBModule } from '@/infra/db/db.module';
import { GlobalModule } from '@/infra/global/global.module';
import { getConfigOptions } from '@/shared/common/common.dotenv';

import { MiddlewareModule } from '../infra/middleware/middleware.module';
import { ApiModule } from './api/api.module';
import { HealthModule } from './api/root/health/health.module';
import { AppCron } from './app.cron';
import { CliModule } from './cli/cli.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    // Global
    ConfigModule.forRoot(getConfigOptions()),

    DBModule,
    GlobalModule,
    DomainModule,
    MiddlewareModule,
    ApiModule,
  ],
})
export class AppApiModule {}

@Module({
  imports: [
    // Global
    ConfigModule.forRoot(getConfigOptions()),

    HealthModule,
    DBModule,
    GlobalModule,
    DomainModule,
    WorkerModule,
  ],
})
export class AppWorkerModule {}

@Module({
  providers: [AppCron],
  imports: [
    // Global
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(getConfigOptions()),

    HealthModule,
    DBModule,
    GlobalModule,
    DomainModule,
    HealthModule,
  ],
})
export class AppCronModule {}

@Module({
  imports: [
    // Global
    ConfigModule.forRoot(getConfigOptions()),

    DBModule,
    GlobalModule,
    DomainModule,
    CliModule,
  ],
})
export class AppCliModule {}
