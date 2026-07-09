import { Injectable } from '@nestjs/common';
import { Cron as ScheduleCron, CronExpression } from '@nestjs/schedule';

import { BaseAmqpExchange } from '@/infra/global/amqp/amqp.abstract';
import { AmqpService } from '@/infra/global/amqp/amqp.service';

import { CRON_QUEUES, MQ_EXCHANGE } from './worker/worker.constant';

function Cron(cronTime: string | CronExpression): MethodDecorator {
  return ScheduleCron(cronTime, { timeZone: 'Asia/Bangkok' });
}

@Injectable()
export class AppCron extends BaseAmqpExchange {
  config = MQ_EXCHANGE.CRON;

  constructor(private _amqpService: AmqpService) {
    super(_amqpService);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanup() {
    this.addJob(CRON_QUEUES.CLEAN_UP.name);
  }
}
