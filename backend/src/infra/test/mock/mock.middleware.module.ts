import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { ReqStorageInterceptor } from '@/infra/middleware/req-storage/req-storage.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ReqStorageInterceptor,
    },
  ],
})
export class MockMiddlewareModule {}
