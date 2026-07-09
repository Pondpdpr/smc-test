import { Global, Module } from '@nestjs/common';

import { GLOBAL_PROVIDER } from './global.provider';

@Global()
@Module({
  providers: GLOBAL_PROVIDER,
  exports: GLOBAL_PROVIDER,
})
export class GlobalModule {}
