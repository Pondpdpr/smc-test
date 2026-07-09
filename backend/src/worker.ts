import { NestFactory } from '@nestjs/core';

import { MQ_EXCHANGE } from '@/app/worker/worker.constant';
import { config } from '@/infra/config';
import { AmqpService } from '@/infra/global/amqp/amqp.service';
import { coreLogger } from '@/shared/common/common.logger';
import { createMqWorker } from '@/shared/common/common.worker';

import { AppWorkerModule } from './app/app.module';

const appConfig = config().app;

async function bootstrap() {
  const app = await NestFactory.create(AppWorkerModule, {
    logger: coreLogger(appConfig),
  });
  await app.init();

  await app.get(AmqpService).setupQueues(MQ_EXCHANGE);
  createMqWorker(app, MQ_EXCHANGE);

  app.enableShutdownHooks();

  console.log('worker running...');
  await app.listen(appConfig.workerPort);
}
bootstrap();
