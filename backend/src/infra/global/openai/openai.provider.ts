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

    // The SDK constructor throws if apiKey is an empty string, which would
    // otherwise crash the whole app at boot (this provider is global, so
    // every process - API, CLI, tests - would fail before running a single
    // line, even ones that never touch chat). Falling back to a placeholder
    // means an unconfigured key only fails when a chat request is actually
    // made, not at boot.
    return new OpenAI({ apiKey: openaiConfig.apiKey || 'sk-not-configured' });
  },
};
