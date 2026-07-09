import { Module } from '@nestjs/common';

import { createMqHandler } from '@/shared/common/common.worker';

import { MQ_EXCHANGE } from '../worker.constant';
import { DomainEventAmqp } from './domain-event.amqp';

@Module({
  providers: [
    //
    createMqHandler(MQ_EXCHANGE.DOMAIN_EVENT.name, DomainEventAmqp),
  ],
})
export class DomainEventModule {}
