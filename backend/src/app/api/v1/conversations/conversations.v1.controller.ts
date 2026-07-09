import { Controller, Delete, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { UserClaims } from '@/infra/middleware/jwt/jwt.common';

import { DeleteConversationCommand } from './delete-conversation/delete-conversation.command';
import { DeleteConversationResponse } from './delete-conversation/delete-conversation.dto';
import { GetMessagesResponse } from './get-messages/get-messages.dto';
import { GetMessagesQuery } from './get-messages/get-messages.query';
import { ListConversationsResponse } from './list-conversations/list-conversations.dto';
import { ListConversationsQuery } from './list-conversations/list-conversations.query';

@Controller({ path: 'conversations', version: '1' })
export class ConversationsV1Controller {
  constructor(
    private listConversationsQuery: ListConversationsQuery,
    private getMessagesQuery: GetMessagesQuery,
    private deleteConversationCommand: DeleteConversationCommand,
  ) {}

  @Get()
  async listConversations(
    @UserClaims() claims: UserClaims,
  ): Promise<ListConversationsResponse> {
    return this.listConversationsQuery.exec(claims.userId);
  }

  @Get(':id/messages')
  async getMessages(
    @UserClaims() claims: UserClaims,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMessagesResponse> {
    return this.getMessagesQuery.exec(claims.userId, id);
  }

  @Delete(':id')
  async deleteConversation(
    @UserClaims() claims: UserClaims,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteConversationResponse> {
    return this.deleteConversationCommand.exec(claims.userId, id);
  }
}
