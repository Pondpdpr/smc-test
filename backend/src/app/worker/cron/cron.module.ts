import { Module } from '@nestjs/common';

import { createMqHandler } from '@/shared/common/common.worker';

import { MQ_EXCHANGE } from '../worker.constant';
import { CleanupCommand } from './cleanup/cleanup.command';
import { CronAmqp } from './cron.amqp';

@Module({
  providers: [
    CleanupCommand,

    //
    createMqHandler(MQ_EXCHANGE.CRON.name, CronAmqp),
  ],
})
export class CronModule {}
