import { Module } from '@nestjs/common';

import { ChatService } from './chat.service';
import { ChatStopService } from './chat-stop.service';
import { UsageService } from './usage.service';

@Module({
  providers: [ChatService, UsageService, ChatStopService],
  exports: [ChatService, UsageService, ChatStopService],
})
export class ChatModule {}
