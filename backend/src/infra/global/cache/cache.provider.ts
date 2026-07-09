import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import type { AppConfig } from '@/infra/config';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const RedisCacheProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisConfig = configService.getOrThrow<AppConfig['redis']>('redis');
    const appConfig = configService.getOrThrow<AppConfig['app']>('app');

    const client = new Redis(redisConfig.url, {
      lazyConnect: true,
    });
    if (appConfig.enableCache) {
      await client.connect();
    }

    return client;
  },
};
