import type { INestApplicationContext, Provider } from '@nestjs/common';

import { ExchangeConfig } from '@/app/worker/worker.constant';
import { JobInput } from '@/app/worker/worker.type';
import { MessageTaskService } from '@/domain/base/message-task/message-task.service';
import {
  isMessageTaskMaxAttemptsReached,
  markMessageTaskAsDead,
  markMessageTaskAsFailed,
  markMessageTaskAsInvalid,
  markMessageTaskAsSuccess,
} from '@/domain/base/message-task/message-task.util';
import {
  InvalidJobPayloadParseException,
  TaskMetaZod,
} from '@/infra/global/amqp/amqp.common';
import { AmqpService } from '@/infra/global/amqp/amqp.service';

function addNamePrefix(name: string) {
  return `worker-${name}`;
}

export function createMqWorker(
  app: INestApplicationContext,
  configs: Record<string, ExchangeConfig>,
) {
  const mqService = app.get(AmqpService);
  const messageTaskService = app.get(MessageTaskService);
  for (const config of Object.values(configs)) {
    try {
      const handler = app.get(addNamePrefix(config.name));

      for (const queue of config.queues) {
        const queueName = `${config.name}.${queue.name}.main`;

        const isDisableConsumer = queue.config?.disableConsumer ?? false;
        if (isDisableConsumer) {
          continue;
        }

        mqService.channel.consume(queueName, async (msg) => {
          const message = msg!;

          const payload = JSON.parse(
            message.content.toString(),
          ) as JobInput<any>;

          const parsedMeta = TaskMetaZod.safeParse(payload.meta);
          if (!parsedMeta.success) {
            // stop here if cant parse
            await messageTaskService.saveAsInvalidPayload({
              exchangeName: config.name,
              queueName,
              payload: structuredClone(payload),
            });
            await mqService.handleSuccess(message);
            return;
          }

          let task = await messageTaskService.process(payload.meta.id, {
            exchangeName: config.name,
            queueName,
            payload,
          });

          try {
            await handler.dispatch(queue.name, payload.data);
            await mqService.handleSuccess(message);
            task = markMessageTaskAsSuccess(task);
          } catch (err: any) {
            if (isMessageTaskMaxAttemptsReached(task)) {
              await mqService.handleDead(message);
              task = markMessageTaskAsDead(task, err['message']);
            } else if (err instanceof InvalidJobPayloadParseException) {
              await mqService.handleDead(message);
              task = markMessageTaskAsInvalid(task, err['message']);
            } else {
              await mqService.handleFail(message);
              task = markMessageTaskAsFailed(task, err['message']);
            }
          }

          await messageTaskService.save(task);
        });
      }
    } catch {
      console.log('==================================');
      console.log(`Queue handler ${config.name} not found`);
      console.log('==================================');
      continue;
    }
  }
}

export function createMqHandler(key: string, clazz: any): Provider {
  return {
    provide: addNamePrefix(key),
    useClass: clazz,
  };
}
