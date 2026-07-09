import { Injectable } from '@nestjs/common';

import { Conversation } from '@/domain/base/conversation/conversation.domain';
import { ConversationService } from '@/domain/base/conversation/conversation.service';
import { ChatStopService } from '@/domain/logic/chat/chat-stop.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { StopChatResponse } from './stop-chat.dto';

@Injectable()
export class StopChatCommand implements CommandInterface {
  constructor(
    private conversationService: ConversationService,
    private chatStopService: ChatStopService,
  ) {}

  async exec(
    userId: string,
    conversationId: string,
  ): Promise<StopChatResponse> {
    const conversation = await this.find(userId, conversationId);

    await this.save(conversation);

    return toHttpSuccess({ data: { stopped: true } });
  }

  async find(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationService.findOne(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new ApiException(404, 'conversationNotFound');
    }

    return conversation;
  }

  async save(conversation: Conversation) {
    await this.chatStopService.requestStop(conversation.id);
  }
}
