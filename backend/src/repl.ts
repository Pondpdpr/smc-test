import { Module } from '@nestjs/common';
import { repl } from '@nestjs/core';

import { WorkerModule } from '@/app/worker/worker.module';

import { AppApiModule } from './app/app.module';

@Module({
  imports: [AppApiModule, WorkerModule],
})
class ReplModule {}

async function bootstrap() {
  await repl(ReplModule);
}
bootstrap();
