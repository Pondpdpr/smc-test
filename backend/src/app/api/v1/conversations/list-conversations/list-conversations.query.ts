import { Injectable } from '@nestjs/common';

import { conversationPgToResponse } from '@/domain/base/conversation/conversation.mapper';
import { MainDb } from '@/infra/db/db.main';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { ListConversationsResponse } from './list-conversations.dto';

@Injectable()
export class ListConversationsQuery implements QueryInterface {
  constructor(private db: MainDb) {}

  async exec(userId: string): Promise<ListConversationsResponse> {
    const rows = await this.getRaw(userId);

    return toHttpSuccess({
      data: {
        conversations: rows.map((row) => ({
          attributes: conversationPgToResponse(row),
        })),
      },
    });
  }

  async getRaw(userId: string) {
    return this.db.read
      .selectFrom('conversations')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('updated_at', 'desc')
      .execute();
  }
}
