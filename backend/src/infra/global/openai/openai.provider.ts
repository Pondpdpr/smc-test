import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type { AppConfig } from '@/infra/config';

export const OPENAI_CLIENT = Symbol('OPENAI_CLIENT');

export const OpenAiClientProvider: Provider = {
  provide: OPENAI_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): OpenAI => {
    const openaiConfig =
      configService.getOrThrow<AppConfig['openai']>('openai');

    // The SDK throws on an empty apiKey, which would crash every process (API, CLI,
    // tests) at boot - a placeholder defers that failure to an actual chat request.
    return new OpenAI({ apiKey: openaiConfig.apiKey || 'sk-not-configured' });
  },
};
