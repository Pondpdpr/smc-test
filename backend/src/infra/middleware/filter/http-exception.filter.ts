import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppConfig } from '@/infra/config';
import { LoggerService } from '@/infra/global/logger/logger.service';
import { IStandardErrorResonse } from '@/shared/type/type.http';

import { HttpBaseException } from '../../../shared/http/http.exception';

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const appConfig = this.configService.getOrThrow<AppConfig['app']>('app');

    const { method, url, query, body } = request;

    let status = exception.getStatus?.() || 500;
    let key = 'internal';
    let context: Record<string, any> = {};
    let fields = {};

    this.loggerService.error(exception);

    // const userAgent = request.get('user-agent') || '';

    if (exception instanceof HttpBaseException) {
      const baseException: HttpBaseException = exception;

      context = baseException.getContext();
      fields = baseException.getFields();
      status = baseException.httpStatus;
      key = baseException.key;

      if (!appConfig.enableErrorDetails) {
        // Not exposing prod files
        delete context['stack'];
      }
    }

    const resp: IStandardErrorResonse = {
      success: false,
      key,
      error: {
        fields,
        context,
        details: appConfig.enableErrorDetails
          ? {
              method,
              query,
              body,
              path: url,
              cause: exception.cause,
              stack: exception.stack,
            }
          : null,
      },
    };

    response.code(status).send(resp);
  }
}
