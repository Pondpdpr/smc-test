import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { HttpExceptionFilter } from '@/infra/middleware/filter/http-exception.filter';

import { JwtGuard } from './jwt/jwt.guard';
import { ReqStorageInterceptor } from './req-storage/req-storage.interceptor';
import { CoreZodValidationPipe } from './validation/zod-validation.pipe';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ReqStorageInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: CoreZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class MiddlewareModule {}
