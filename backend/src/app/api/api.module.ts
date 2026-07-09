import { Module } from '@nestjs/common';

import { RootModule } from './root/root.module';
import { V1Module } from './v1/v1.module';

@Module({
  imports: [
    //
    RootModule,
    V1Module,
  ],
})
export class ApiModule {}
