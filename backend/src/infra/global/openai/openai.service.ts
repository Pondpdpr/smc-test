import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';

import type { AppConfig } from '@/infra/config';

import { OPENAI_CLIENT } from './openai.provider';

@Injectable()
export class OpenAiService {
  constructor(
    @Inject(OPENAI_CLIENT)
    private client: OpenAI,
    private configService: ConfigService,
  ) {}

  // Thin wrapper around the raw SDK call - no business logic here (no
  // tool-calling loop, no SSE formatting, no cost math). That all lives in
  // domain/logic/chat/chat.service.ts, which is the one that knows *why*
  // it's calling OpenAI.
  streamChatCompletion(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
    toolChoice?: ChatCompletionToolChoiceOption,
  ) {
    const { model } =
      this.configService.getOrThrow<AppConfig['openai']>('openai');

    return this.client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: toolChoice,
      stream: true,
      // Needed to get prompt/completion token counts on the final chunk,
      // which is how chat.service.ts computes cost_usd_micros.
      stream_options: { include_usage: true },
    });
  }
}
