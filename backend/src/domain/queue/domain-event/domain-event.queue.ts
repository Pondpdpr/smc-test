import { Injectable } from '@nestjs/common';

import {
  SampleData,
  SampleRawPayload,
} from '@/app/worker/domain-event/domain-event.type';
import { DOMAIN_EVENT_QUEUES, MQ_EXCHANGE } from '@/app/worker/worker.constant';
import { BaseAmqpExchange } from '@/infra/global/amqp/amqp.abstract';
import { wrapJobMeta } from '@/infra/global/amqp/amqp.common';

@Injectable()
export class DomainEventQueue extends BaseAmqpExchange {
  config = MQ_EXCHANGE.DOMAIN_EVENT;

  addJobSample(data: SampleData) {
    const raw: SampleRawPayload = wrapJobMeta({
      key: data.key,
    });

    this.addJob(DOMAIN_EVENT_QUEUES.SAMPLE.name, raw);
  }
}
