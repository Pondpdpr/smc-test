import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { UAParser } from 'ua-parser-js';

import type { ReqData } from '@/infra/global/req-storage/req-storage.common';
import { ReqStorage } from '@/infra/global/req-storage/req-storage.service';
import { generateUID } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import {
  DEVICE_HEADER,
  LANG_HEADER,
  TRACE_ID_HEADER,
} from '@/shared/http/http.headers';

@Injectable()
export class ReqStorageInterceptor implements NestInterceptor {
  constructor(private reqStorage: ReqStorage) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const uaData = UAParser(request.headers['user-agent']);

    const traceId = request.headers[TRACE_ID_HEADER] as string;
    const deviceUid = request.headers[DEVICE_HEADER] as string;
    const coreCtx: ReqData = {
      traceId: traceId || generateUID(),
      requestTime: myDayjs().toISOString(),
      agent: uaData.ua,
      device: uaData.device,
      deviceUid: deviceUid || null,
      os: uaData.os?.name || '',
      ip: (request.headers['x-forwarded-for'] as string) || request.ip || '',
      browser: uaData.browser?.name || '',
      lang: (request.headers[LANG_HEADER] as any) || null,
    };

    return this.reqStorage.run(coreCtx, () => next.handle());
  }
}
