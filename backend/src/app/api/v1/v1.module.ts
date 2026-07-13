import { Module } from '@nestjs/common';

import { AuthV1Module } from './auth/auth.v1.module';
import { ChatV1Module } from './chat/chat.v1.module';
import { ConversationsV1Module } from './conversations/conversations.v1.module';

@Module({
  imports: [AuthV1Module, ConversationsV1Module, ChatV1Module],
})
export class V1Module {}
