import { Injectable } from '@nestjs/common';

import { Conversation } from '@/domain/base/conversation/conversation.domain';
import { conversationToResponse } from '@/domain/base/conversation/conversation.mapper';
import { ConversationService } from '@/domain/base/conversation/conversation.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { DeleteConversationResponse } from './delete-conversation.dto';

@Injectable()
export class DeleteConversationCommand implements CommandInterface {
  constructor(private conversationService: ConversationService) {}

  async exec(
    userId: string,
    conversationId: string,
  ): Promise<DeleteConversationResponse> {
    const conversation = await this.find(userId, conversationId);

    await this.save(conversation);

    return toHttpSuccess({
      data: {
        conversation: { attributes: conversationToResponse(conversation) },
      },
    });
  }

  async find(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationService.findOne(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ApiException(404, 'conversationNotFound');
    }

    return conversation;
  }

  async save(conversation: Conversation) {
    await this.conversationService.delete(conversation);
  }
}
