import { Injectable } from '@nestjs/common';

import { ExchangeConfig } from '@/app/worker/worker.constant';
import { getTaskHandlers, TaskMetadata } from '@/shared/task/task.decorator';

import { InvalidJobPayloadParseException } from './amqp.common';
import { AmqpService } from './amqp.service';

@Injectable()
export abstract class BaseAmqpExchange {
  abstract config: ExchangeConfig;

  constructor(private amqpService: AmqpService) {}

  addJob(name: string, data?: any) {
    this.amqpService.publishMessage(this.config.name, name, data ?? {});
  }
}

@Injectable()
export abstract class BaseAmqpHandler {
  private _taskMap: Record<string, TaskMetadata>;

  constructor() {
    this._taskMap = getTaskHandlers(this);
  }

  async dispatch(name: string, data: object): Promise<void> {
    const metadata = this._taskMap[name];
    if (!metadata) {
      throw new Error(`metadata for job ${name} not found!`);
    }

    const methodName = metadata.methodName;
    if (!methodName) {
      // this should never happen, but handle just in case
      throw new Error(`unexpected: method name for ${name} not found`);
    }

    // handle task pipe
    const validator = metadata.validator;
    if (validator) {
      try {
        validator(data);
      } catch (e: unknown) {
        throw new InvalidJobPayloadParseException(`failed parsing: ${e}`);
      }
    }

    // handle task
    const method = (this as any)[methodName];
    if (method && typeof method === 'function') {
      await method.call(this, data);
    }
  }
}
