import { Inject } from '@nestjs/common';

import type { CoreDB, ReadDB } from '@/infra/db/db.common';
import { KYSELY, READ_DB } from '@/infra/db/db.common';
import { TransactionService } from '@/infra/db/transaction/transaction.service';

export abstract class BaseRepo {
  constructor(
    @Inject(KYSELY)
    private _coreDb: CoreDB,
    @Inject(READ_DB)
    private _db: ReadDB,
    private transactionService: TransactionService,
  ) {}

  protected get db(): CoreDB {
    let mainDb: CoreDB = this._currentTransaction() as unknown as CoreDB;
    if (!mainDb) {
      mainDb = this._coreDb;
    }

    return mainDb;
  }

  protected get readDb(): ReadDB {
    let read: ReadDB = this._currentTransaction() as unknown as CoreDB;
    if (!read) {
      read = this._db;
    }

    return read;
  }

  private _currentTransaction() {
    return this.transactionService.$getTransaction();
  }
}

export abstract class ReadRepo {
  constructor(
    @Inject(READ_DB)
    private _db: ReadDB,
  ) {}

  protected get readDb(): ReadDB {
    return this._db;
  }
}
