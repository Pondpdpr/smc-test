import { Module } from '@nestjs/common';

import { MessageTaskService } from './message-task.service';

@Module({
  providers: [MessageTaskService],
  exports: [MessageTaskService],
})
export class MessageTaskModule {}
