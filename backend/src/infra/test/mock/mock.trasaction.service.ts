import { Injectable } from '@nestjs/common';

import { TransactionService } from '@/infra/db/transaction/transaction.service';

@Injectable()
export class MockTransactionService implements Omit<
  TransactionService,
  '_transactionStorage'
> {
  private _testTransaction: any = null;

  async transaction<T>(callback: () => Promise<T>) {
    return callback();
  }

  $setTransaction(trx: any) {
    this._testTransaction = trx;
  }

  $getTransaction(): any | null {
    return this._testTransaction ?? null;
  }
}
