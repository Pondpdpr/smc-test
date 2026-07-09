import { Module } from '@nestjs/common';

import { ChatV1Controller } from './chat.v1.controller';
import { GetUsageQuery } from './get-usage/get-usage.query';
import { StopChatCommand } from './stop-chat/stop-chat.command';

@Module({
  controllers: [ChatV1Controller],
  providers: [GetUsageQuery, StopChatCommand],
})
export class ChatV1Module {}
