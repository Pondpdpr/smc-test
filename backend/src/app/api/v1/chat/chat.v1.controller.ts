import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { ChatService } from '@/domain/logic/chat/chat.service';
import { UserClaims } from '@/infra/middleware/jwt/jwt.common';

import { GetUsageResponse } from './get-usage/get-usage.dto';
import { GetUsageQuery } from './get-usage/get-usage.query';
import { StopChatCommand } from './stop-chat/stop-chat.command';
import { StopChatResponse } from './stop-chat/stop-chat.dto';
import { StreamChatDto } from './stream-chat/stream-chat.dto';

function writeSseEvent(reply: FastifyReply, event: string, data: unknown) {
  reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

@Controller({ path: 'chat', version: '1' })
export class ChatV1Controller {
  constructor(
    private chatService: ChatService,
    private getUsageQuery: GetUsageQuery,
    private stopChatCommand: StopChatCommand,
  ) {}

  // SSE, so this one doesn't follow the usual command/query-returns-JSON
  // pattern - the controller owns writing the wire format itself. Validation
  // and the user-message write happen in prepareTurn() BEFORE we touch the
  // raw response, so a bad request (404/429) still comes back as a normal
  // JSON error rather than a half-opened stream.
  @Post('stream')
  async stream(
    @UserClaims() claims: UserClaims,
    @Body() body: StreamChatDto,
    @Res({ passthrough: false }) reply: FastifyReply,
  ): Promise<void> {
    const { conversationId } = await this.chatService.prepareTurn(
      claims.userId,
      {
        conversationId: body.conversationId,
        message: body.message,
      },
    );

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Both bypass response buffering that would otherwise defeat
      // token-by-token streaming: compression middleware buffers to gzip,
      // and reverse proxies like nginx buffer by default too.
      'Content-Encoding': 'identity',
      'X-Accel-Buffering': 'no',
    });

    writeSseEvent(reply, 'conversation', { conversationId });

    for await (const chatEvent of this.chatService.streamAssistantReply(
      claims.userId,
      conversationId,
    )) {
      writeSseEvent(reply, chatEvent.event, chatEvent.data);
    }

    reply.raw.end();
  }

  @Post('stop/:conversationId')
  async stop(
    @UserClaims() claims: UserClaims,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<StopChatResponse> {
    return this.stopChatCommand.exec(claims.userId, conversationId);
  }

  @Get('usage')
  async usage(@UserClaims() claims: UserClaims): Promise<GetUsageResponse> {
    return this.getUsageQuery.exec(claims.userId);
  }
}
