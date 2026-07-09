import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

import type { AppConfig } from '@/infra/config';

export const NODE_MAILER = Symbol('NODE_MAILER');

export const NodeMailerProvider: Provider = {
  provide: NODE_MAILER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Mail => {
    const emailConfig = configService.getOrThrow<AppConfig['email']>('email');

    const hasAuth = !!(emailConfig.user || emailConfig.password);

    return createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: hasAuth
        ? {
            user: emailConfig.user,
            pass: emailConfig.password,
          }
        : undefined,
    });
  },
};
