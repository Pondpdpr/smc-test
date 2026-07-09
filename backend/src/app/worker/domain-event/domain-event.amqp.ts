import { Injectable } from '@nestjs/common';

import { BaseAmqpHandler } from '@/infra/global/amqp/amqp.abstract';
import { QueueTask } from '@/shared/task/task.decorator';

import { DOMAIN_EVENT_QUEUES } from '../worker.constant';
import type { SampleData } from './domain-event.type';

@Injectable()
export class DomainEventAmqp extends BaseAmqpHandler {
  @QueueTask(DOMAIN_EVENT_QUEUES.SAMPLE.name)
  async processSample(data: SampleData) {
    console.log('==================================');
    console.log(`User login: ${data.key}`);
    console.log('==================================');
  }
}
