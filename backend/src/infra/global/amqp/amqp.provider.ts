import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';

import { AppConfig } from '@/infra/config';

export const AMQP_CLIENT = Symbol('AMQP_CLIENT');
export const AmqpClientProvider: Provider = {
  provide: AMQP_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const amqpConfig = configService.getOrThrow<AppConfig['amqp']>('amqp');

    return connect(amqpConfig.url);
  },
};
