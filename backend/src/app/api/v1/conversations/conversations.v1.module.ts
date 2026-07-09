import { Module } from '@nestjs/common';

import { ConversationsV1Controller } from './conversations.v1.controller';
import { DeleteConversationCommand } from './delete-conversation/delete-conversation.command';
import { GetMessagesQuery } from './get-messages/get-messages.query';
import { ListConversationsQuery } from './list-conversations/list-conversations.query';

@Module({
  controllers: [ConversationsV1Controller],
  providers: [
    ListConversationsQuery,
    GetMessagesQuery,
    DeleteConversationCommand,
  ],
})
export class ConversationsV1Module {}
