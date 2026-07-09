import { Inject, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

import type { CoreDB } from '@/infra/db/db.common';
import { KYSELY } from '@/infra/db/db.common';
import { ApiException, HttpBaseException } from '@/shared/http/http.exception';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(KYSELY)
    private coreDb: CoreDB,
  ) {}

  private _transactionStorage = new AsyncLocalStorage<any>();

  async transaction<T>(callback: () => Promise<T>) {
    const storedTransaction = this.$getTransaction();
    if (storedTransaction) {
      // if already have stored trans do nothing
      return callback();
    }

    const tx = await this._startTransaction(this.coreDb);
    if (!tx) {
      // test will return null (handle for test only)
      return callback();
    }

    try {
      const res = await this._runTransaction(tx, callback);

      await tx.commit().execute();
      return res;
    } catch (error) {
      await tx.rollback().execute();
      if (error instanceof HttpBaseException) {
        throw error;
      }

      throw new ApiException(500, 'transactionFail', { error });
    }
  }

  $getTransaction(): any | null {
    return this._transactionStorage.getStore() ?? null;
  }

  $setTransaction(trx: any) {
    this._transactionStorage.enterWith(trx);
  }

  private async _runTransaction<T>(trx: any, fn: () => Promise<T>) {
    return this._transactionStorage.run(trx, fn);
  }

  private async _startTransaction(db: CoreDB) {
    return db.startTransaction().execute();
  }

  private _clearTransaction() {
    this._transactionStorage.disable();
  }
}
