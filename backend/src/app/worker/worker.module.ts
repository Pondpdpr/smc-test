import { Module } from '@nestjs/common';

import { CronModule } from './cron/cron.module';
import { DomainEventModule } from './domain-event/domain-event.module';
import { EmailVerificationModule } from './email-verification/email-verification.module';

@Module({
  imports: [DomainEventModule, CronModule, EmailVerificationModule],
})
export class WorkerModule {}
