import { Global, Module, Provider } from '@nestjs/common';

import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { LoggerService } from '@/infra/global/logger/logger.service';

const serviceProviders: Provider[] = [TransactionService, LoggerService];

@Global()
@Module({
  providers: serviceProviders,
  exports: serviceProviders,
})
export class MockGlobalModule {}
