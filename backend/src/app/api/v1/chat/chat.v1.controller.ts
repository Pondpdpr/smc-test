import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ChatService } from '@/domain/logic/chat/chat.service';
import { ChatStopService } from '@/domain/logic/chat/chat-stop.service';
import { config } from '@/infra/config';
import { LoggerService } from '@/infra/global/logger/logger.service';
import { UserClaims } from '@/infra/middleware/jwt/jwt.common';

import { GetUsageResponse } from './get-usage/get-usage.dto';
import { GetUsageQuery } from './get-usage/get-usage.query';
import { StopChatCommand } from './stop-chat/stop-chat.command';
import { StopChatResponse } from './stop-chat/stop-chat.dto';
import { StreamChatDto } from './stream-chat/stream-chat.dto';

// writeHead() below writes straight to the raw Node response, bypassing
// @fastify/cors entirely (it only hooks into Fastify's own reply lifecycle) -
// so this stream is the one endpoint that has to add its own CORS headers,
// replicating the same origin whitelist main.ts hands to the cors plugin.
function corsHeadersFor(request: FastifyRequest): Record<string, string> {
  const origin = request.headers.origin;
  if (!origin || !config().app.corsOrigin.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

// Safe to call after headers are sent - a destroyed/closed socket makes
// .write() a no-op-ish throw, which we don't want taking down the process.
function writeSseEvent(reply: FastifyReply, event: string, data: unknown) {
  if (reply.raw.destroyed || reply.raw.writableEnded) {
    return;
  }
  try {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Client disconnected between the destroyed-check and the write - ignore.
  }
}

@Controller({ path: 'chat', version: '1' })
export class ChatV1Controller {
  constructor(
    private chatService: ChatService,
    private getUsageQuery: GetUsageQuery,
    private stopChatCommand: StopChatCommand,
    private chatStopService: ChatStopService,
    private loggerService: LoggerService,
  ) {}

  // SSE, so this one doesn't follow the usual command/query-returns-JSON
  // pattern - the controller owns writing the wire format itself. Validation
  // and the user-message write happen in prepareTurn() BEFORE we touch the
  // raw response, so a bad request (404/429) still comes back as a normal
  // JSON error rather than a half-opened stream.
  //
  // Everything AFTER writeHead() is wrapped in try/catch/finally and never
  // rethrows: once raw headers are sent, Nest's default exception handling
  // would try reply.send() on an error, which crashes the whole process with
  // ERR_HTTP_HEADERS_SENT (this happened in practice - a disconnecting
  // client mid-stream threw past an unguarded loop).
  @Post('stream')
  async stream(
    @UserClaims() claims: UserClaims,
    @Body() body: StreamChatDto,
    @Req() request: FastifyRequest,
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
      ...corsHeadersFor(request),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Both bypass response buffering that would otherwise defeat
      // token-by-token streaming: compression middleware buffers to gzip,
      // and reverse proxies like nginx buffer by default too.
      'Content-Encoding': 'identity',
      'X-Accel-Buffering': 'no',
    });

    let finished = false;

    // If the client disconnects (tab closed, Stop button aborts the fetch),
    // treat it the same as an explicit stop so we don't keep burning OpenAI
    // calls against a dead socket.
    reply.raw.on('close', () => {
      if (!finished) {
        this.chatStopService.requestStop(conversationId).catch(() => {});
      }
    });

    try {
      writeSseEvent(reply, 'conversation', { conversationId });

      for await (const chatEvent of this.chatService.streamAssistantReply(
        claims.userId,
        conversationId,
      )) {
        if (reply.raw.destroyed || reply.raw.writableEnded) {
          break;
        }
        writeSseEvent(reply, chatEvent.event, chatEvent.data);
      }
    } catch (error) {
      // Last-resort safety net - chat.service.ts already catches its own
      // errors and yields an 'error' event, so reaching here means
      // something failed outside that (e.g. the write itself).
      this.loggerService.error(
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      finished = true;
      if (!reply.raw.destroyed && !reply.raw.writableEnded) {
        reply.raw.end();
      }
    }
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
