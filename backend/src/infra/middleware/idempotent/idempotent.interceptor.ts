import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable, tap } from 'rxjs';

import { CacheService } from '@/infra/global/cache/cache.service';
import myDayjs from '@/shared/common/common.dayjs';
import { isUuid } from '@/shared/common/common.validator';
import { ApiException } from '@/shared/http/http.exception';
import { IDEMPOTENCY_HEADER } from '@/shared/http/http.headers';
import { DayjsDuration } from '@/shared/type/type.common';

import { Idempotency, IDEMPOTENT_CONTEXT } from './idempotent.common';

export function UseIdempotent(
  cacheDuration?: DayjsDuration,
): MethodDecorator & ClassDecorator {
  const Intercept = createIdempotentInterceptor(cacheDuration);
  return applyDecorators(UseInterceptors(Intercept));
}

export function createIdempotentInterceptor(
  cacheDuration?: DayjsDuration,
): Type<NestInterceptor> {
  @Injectable()
  class IdempotentInterceptorMixin implements NestInterceptor {
    constructor(private readonly cacheService: CacheService) {}

    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const req = context.switchToHttp().getRequest<FastifyRequest>();

      const key = req.headers[IDEMPOTENCY_HEADER] as string;
      if (!key || !isUuid(key)) {
        throw new ApiException(400, 'missingIdempotencyKey');
      }

      const cacheKey = `idempotent:${key}`;
      const exist = await this.cacheService.get<number>(cacheKey);

      const ctx: Idempotency = {
        key,
        isOriginal: !exist,
      };

      req[IDEMPOTENT_CONTEXT] = ctx;

      return next.handle().pipe(
        tap(async () => {
          if (!exist) {
            await this.cacheService.set(
              cacheKey,
              1,
              myDayjs.duration(cacheDuration ?? { minutes: 1 }).asSeconds(),
            );
          }
        }),
      );
    }
  }

  return mixin(IdempotentInterceptorMixin);
}
