import { Module } from '@nestjs/common';

import { createMqHandler } from '@/shared/common/common.worker';

import { MQ_EXCHANGE } from '../worker.constant';
import { EmailVerificationAmqp } from './email-verification.amqp';

@Module({
  providers: [
    //
    createMqHandler(MQ_EXCHANGE.EMAIL_VERIFICATION.name, EmailVerificationAmqp),
  ],
})
export class EmailVerificationModule {}
