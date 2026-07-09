import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import { isPersist, setPgState } from '@/shared/common/common.domain';

import { Message } from './message.domain';
import { messageFromPg, messageToPg } from './message.mapper';

@Injectable()
export class MessageService {
  constructor(private db: MainDb) {}

  async findOne(id: string) {
    const pg = await this.db.read
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!pg) {
      return null;
    }

    return messageFromPg(pg);
  }

  // Ordered oldest-first, matching how a conversation reads top to bottom
  // (also what makes S5 - reload mid-conversation - come back in order).
  async findByConversationId(conversationId: string) {
    const rows = await this.db.read
      .selectFrom('messages')
      .selectAll()
      .where('conversation_id', '=', conversationId)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map((pg) => messageFromPg(pg));
  }

  // Messages are append-only - save() only ever creates, never updates.
  async save(message: Message) {
    this._validate(message);

    if (!isPersist(message)) {
      await this._create(message);
    }

    setPgState(message, messageToPg(message));
  }

  async saveBulk(messages: Message[]) {
    return Promise.all(messages.map((m) => this.save(m)));
  }

  private _validate(_message: Message) {
    // no rule for now
  }

  private async _create(message: Message) {
    await this.db.write
      .insertInto('messages')
      .values(messageToPg(message))
      .execute();
  }
}
