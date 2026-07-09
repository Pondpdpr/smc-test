import { Injectable } from '@nestjs/common';

import { ConversationService } from '@/domain/base/conversation/conversation.service';
import { messagePgToResponse } from '@/domain/base/message/message.mapper';
import { MainDb } from '@/infra/db/db.main';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { GetMessagesResponse } from './get-messages.dto';

@Injectable()
export class GetMessagesQuery implements QueryInterface {
  constructor(
    private db: MainDb,
    private conversationService: ConversationService,
  ) {}

  async exec(
    userId: string,
    conversationId: string,
  ): Promise<GetMessagesResponse> {
    const rows = await this.getRaw(userId, conversationId);

    return toHttpSuccess({
      data: {
        messages: rows.map((row) => ({
          attributes: messagePgToResponse(row),
        })),
      },
    });
  }

  async getRaw(userId: string, conversationId: string) {
    const conversation = await this.conversationService.findOne(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ApiException(404, 'conversationNotFound');
    }

    // Ordered oldest-first: matches how a conversation reads top to bottom,
    // and is what makes S5 (reload mid-conversation) come back in order.
    return this.db.read
      .selectFrom('messages')
      .selectAll()
      .where('conversation_id', '=', conversationId)
      .orderBy('created_at', 'asc')
      .execute();
  }
}
