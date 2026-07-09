import { Injectable } from '@nestjs/common';

import {
  EmailVerificationData,
  EmailVerificationRawPayload,
} from '@/app/worker/email-verification/email-verification.type';
import {
  EMAIL_VERIFICATION_QUEUES,
  MQ_EXCHANGE,
} from '@/app/worker/worker.constant';
import { BaseAmqpExchange } from '@/infra/global/amqp/amqp.abstract';
import { wrapJobMeta } from '@/infra/global/amqp/amqp.common';

@Injectable()
export class EmailVerificationQueue extends BaseAmqpExchange {
  config = MQ_EXCHANGE.EMAIL_VERIFICATION;

  sendVerificationEmail(data: EmailVerificationData) {
    const raw: EmailVerificationRawPayload = wrapJobMeta(data);

    this.addJob(EMAIL_VERIFICATION_QUEUES.SEND.name, raw);
  }
}
