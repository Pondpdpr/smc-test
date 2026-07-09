import { Injectable } from '@nestjs/common';

import { WhereBuilder } from '@/infra/db/db.common';
import { MainDb } from '@/infra/db/db.main';
import { sortQb } from '@/infra/db/db.util';
import { uuidV7 } from '@/shared/common/common.crypto';
import {
  getPgState,
  isPersist,
  setPgState,
} from '@/shared/common/common.domain';
import { diff, getUniqueIds } from '@/shared/common/common.func';
import { getQueryPagination } from '@/shared/common/common.pagination';

import { MessageTask } from './message-task.domain';
import { messageTaskFromPg, messageTaskToPg } from './message-task.mapper';
import {
  MessageTaskQueryOptions,
  ProcessMessageOpts,
} from './message-task.type';
import {
  markMessageTaskAsDead,
  newMessageTask,
  startProcessMessageTask,
} from './message-task.util';

@Injectable()
export class MessageTaskService {
  constructor(private db: MainDb) {}

  async saveAsInvalidPayload(opts: ProcessMessageOpts) {
    let task = newMessageTask({
      id: uuidV7(),
      queueName: opts.queueName,
      messageStatus: 'INVALID_PAYLOAD',
      exchangeName: opts.exchangeName,
      payload: opts.payload,
    });
    task = markMessageTaskAsDead(task);

    await this.save(task);
  }

  async process(id: string, opts: ProcessMessageOpts) {
    let task = await this.findOne(id);
    if (!task) {
      return newMessageTask({
        id,
        queueName: opts.queueName,
        exchangeName: opts.exchangeName,
        payload: opts.payload,
      });
    }

    task = startProcessMessageTask(task);
    return task;
  }

  async findIds(opts?: MessageTaskQueryOptions) {
    opts ??= {};

    const { filter, sort, pagination } = opts;
    const { limit, offset } = getQueryPagination(pagination);

    const res = await this.db.read
      .selectFrom('message_tasks')
      .select('message_tasks.id')
      .$if(!!limit, (q) => q.limit(limit!))
      .$if(!!offset, (q) => q.offset(offset!))
      .$if(!!sort?.length, (q) =>
        sortQb(q, sort, {
          id: 'message_tasks.id',
          createdAt: 'message_tasks.created_at',
          updatedAt: 'message_tasks.updated_at',
        }),
      )
      .where((eb) => {
        const builder: WhereBuilder = [];

        if (filter?.queueName) {
          builder.push(eb('queue_name', '=', filter.queueName));
        }

        if (filter?.exchangeName) {
          builder.push(eb('exchange_name', '=', filter.exchangeName));
        }

        if (filter?.messageStatus) {
          builder.push(eb('message_status', '=', filter.messageStatus));
        }

        return eb.and(builder);
      })
      .execute();

    return getUniqueIds(res);
  }

  async findOne(id: string) {
    const messageTaskPg = await this.db.read
      .selectFrom('message_tasks')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!messageTaskPg) {
      return null;
    }

    const messageTask = messageTaskFromPg(messageTaskPg);

    return messageTask;
  }

  async save(messageTask: MessageTask) {
    this._validate(messageTask);

    if (!isPersist(messageTask)) {
      await this._create(messageTask);
    } else {
      await this._update(messageTask.id, messageTask);
    }

    setPgState(messageTask, messageTaskToPg(messageTask));
  }

  async saveBulk(messageTasks: MessageTask[]) {
    return Promise.all(messageTasks.map((mt) => this.save(mt)));
  }

  private _validate(_messageTask: MessageTask) {
    // no rule for now
  }

  private async _create(messageTask: MessageTask) {
    await this.db.write
      .insertInto('message_tasks')
      .values(messageTaskToPg(messageTask))
      .execute();
  }

  private async _update(id: string, messageTask: MessageTask) {
    const data = diff(getPgState(messageTask), messageTaskToPg(messageTask));
    if (!data) {
      return;
    }

    await this.db.write
      .updateTable('message_tasks')
      .set(data)
      .where('id', '=', id)
      .execute();
  }
}
