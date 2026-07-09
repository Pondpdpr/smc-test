import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { TransactionService } from '@/infra/db/transaction/transaction.service';

import type { CoreDB, ReadDB, WriteDB } from './db.common';
import { KYSELY, READ_DB } from './db.common';

@Injectable()
export class MainDb implements OnModuleDestroy {
  constructor(
    @Inject(KYSELY)
    private _writeDb: CoreDB,
    @Inject(READ_DB)
    private _readDb: ReadDB,
    private transactionService: TransactionService,
  ) {}

  async onModuleDestroy() {
    await this._writeDb.destroy();
    await this._readDb.destroy();
  }

  get write(): WriteDB {
    let mainDb: CoreDB = this._currentTransaction() as unknown as CoreDB;
    if (!mainDb) {
      mainDb = this._writeDb;
    }

    return mainDb;
  }

  get read(): ReadDB {
    let read: ReadDB = this._currentTransaction() as unknown as CoreDB;
    if (!read) {
      read = this._readDb;
    }

    return read;
  }

  private _currentTransaction() {
    return this.transactionService.$getTransaction();
  }
}
