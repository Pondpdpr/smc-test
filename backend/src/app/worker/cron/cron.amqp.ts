import { Injectable } from '@nestjs/common';

import { BaseAmqpHandler } from '@/infra/global/amqp/amqp.abstract';
import { QueueTask } from '@/shared/task/task.decorator';

import { CRON_QUEUES } from '../worker.constant';
import { CleanupCommand } from './cleanup/cleanup.command';

@Injectable()
export class CronAmqp extends BaseAmqpHandler {
  constructor(private cleanupCommand: CleanupCommand) {
    super();
  }

  @QueueTask(CRON_QUEUES.CLEAN_UP.name)
  async processCleanup() {
    await this.cleanupCommand.exec();
  }
}
