import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as React from 'react';

import { AppConfig } from '@/infra/config';
import { BaseAmqpHandler } from '@/infra/global/amqp/amqp.abstract';
import { EmailService } from '@/infra/global/email/email.service';
import VerifyEmailTemplate from '@/infra/global/email/template/verify-email.template';
import { QueueTask } from '@/shared/task/task.decorator';

import { EMAIL_VERIFICATION_QUEUES } from '../worker.constant';
import type { EmailVerificationData } from './email-verification.type';

@Injectable()
export class EmailVerificationAmqp extends BaseAmqpHandler {
  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    super();
  }

  @QueueTask(EMAIL_VERIFICATION_QUEUES.SEND.name)
  async sendVerificationEmail(data: EmailVerificationData) {
    const { frontendUrl } =
      this.configService.getOrThrow<AppConfig['app']>('app');
    const url = `${frontendUrl}/verify-email?token=${data.token}`;

    await this.emailService.send(
      data.email,
      'Verify your email',
      React.createElement(VerifyEmailTemplate, {
        firstName: data.firstName,
        url,
      }),
    );
  }
}
