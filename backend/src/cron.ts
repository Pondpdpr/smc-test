import { NestFactory } from '@nestjs/core';

import { config } from '@/infra/config';
import { coreLogger } from '@/shared/common/common.logger';

import { AppCronModule } from './app/app.module';

const appConfig = config().app;

async function bootstrap() {
  const app = await NestFactory.create(AppCronModule, {
    logger: coreLogger(appConfig),
  });
  await app.init();

  app.enableShutdownHooks();

  console.log('cron running...');

  await app.listen(appConfig.cronPort);
}
bootstrap();
