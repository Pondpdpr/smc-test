import { Global, Module } from '@nestjs/common';

import { MainDb } from './db.main';
import { KyselyProvider, ReplicaKyselyProvider } from './db.provider';
import { TransactionService } from './transaction/transaction.service';

@Global()
@Module({
  providers: [
    KyselyProvider,
    ReplicaKyselyProvider,
    TransactionService,
    MainDb,
  ],
  exports: [MainDb, TransactionService],
})
export class DBModule {}
