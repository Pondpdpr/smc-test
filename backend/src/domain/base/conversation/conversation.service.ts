import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import { addPagination, queryCount, sortQb } from '@/infra/db/db.util';
import {
  getPgState,
  isPersist,
  setPgState,
} from '@/shared/common/common.domain';
import { diff, getUniqueIds } from '@/shared/common/common.func';
import { isDefined } from '@/shared/common/common.validator';

import { Conversation } from './conversation.domain';
import { conversationFromPg, conversationToPg } from './conversation.mapper';
import { conversationsTableFilter } from './conversation.util';
import {
  ConversationFilterOptions,
  ConversationQueryOptions,
} from './conversation.zod';

@Injectable()
export class ConversationService {
  constructor(private db: MainDb) {}

  async findIds(opts?: ConversationQueryOptions) {
    opts ??= {};

    const { filter, sort, pagination } = opts;

    const res = await this._getFilterQb(filter)
      .select('conversations.id')
      .$if(!!sort?.length, (q) =>
        sortQb(q, sort, {
          id: 'conversations.id',
          title: 'conversations.title',
          createdAt: 'conversations.created_at',
          updatedAt: 'conversations.updated_at',
        }),
      )
      .$call((q) => addPagination(q, pagination))
      .execute();

    return getUniqueIds(res);
  }

  async getCount(filter?: ConversationFilterOptions) {
    const totalCount = await this
      //
      ._getFilterQb(filter)
      .$call((q) => queryCount(q));

    return totalCount;
  }

  async findOne(id: string) {
    const pg = await this.db.read
      .selectFrom('conversations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!pg) {
      return null;
    }

    return conversationFromPg(pg);
  }

  async delete(conversation: Conversation) {
    await this.db.write
      .deleteFrom('conversations')
      .where('id', '=', conversation.id)
      .execute();
  }

  async save(conversation: Conversation) {
    this._validate(conversation);

    if (!isPersist(conversation)) {
      await this._create(conversation);
    } else {
      await this._update(conversation.id, conversation);
    }

    setPgState(conversation, conversationToPg(conversation));
  }

  async saveBulk(conversations: Conversation[]) {
    return Promise.all(conversations.map((c) => this.save(c)));
  }

  private _validate(_conversation: Conversation) {
    // no rule for now
  }

  private async _create(conversation: Conversation) {
    await this.db.write
      .insertInto('conversations')
      .values(conversationToPg(conversation))
      .execute();
  }

  private async _update(id: string, conversation: Conversation) {
    const data = diff(getPgState(conversation), conversationToPg(conversation));
    if (!data) {
      return;
    }

    await this.db.write
      .updateTable('conversations')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  private _getFilterQb(filter?: ConversationFilterOptions) {
    return this.db.read
      .selectFrom('conversations')
      .where(conversationsTableFilter)
      .$if(isDefined(filter?.userId), (q) =>
        q.where('conversations.user_id', '=', filter!.userId!),
      )
      .$if(isDefined(filter?.search), (q) => {
        const search = `%${filter!.search!}%`;
        return q.where('conversations.title', 'ilike', search);
      });
  }
}
