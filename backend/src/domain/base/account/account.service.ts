import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import { getDbErrorKey } from '@/infra/db/db.util';
import {
  getPgState,
  isPersist,
  setPgState,
} from '@/shared/common/common.domain';
import { diff } from '@/shared/common/common.func';
import { ApiException } from '@/shared/http/http.exception';

import { Account } from './account.domain';
import { accountFromPg, accountToPg } from './account.mapper';

@Injectable()
export class AccountService {
  constructor(private db: MainDb) {}

  async findOne(id: string) {
    const data = await this.db.read
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!data) {
      return null;
    }

    const user = accountFromPg(data);

    return user;
  }

  async save(user: Account) {
    this._validate(user);

    try {
      if (!isPersist(user)) {
        await this._create(user);
      } else {
        await this._update(user.id, user);
      }
    } catch (e) {
      const errKey = getDbErrorKey(e);
      if (errKey === 'exists') {
        throw new ApiException(404, 'usernameExists');
      }
    }

    setPgState(user, accountToPg(user));
  }

  async saveBulk(users: Account[]) {
    return Promise.all(users.map((u) => this.save(u)));
  }

  private _validate(_user: Account) {
    // no rule for now
  }

  private async _create(account: Account) {
    await this.db.write
      //
      .insertInto('accounts')
      .values(accountToPg(account))
      .execute();
  }

  private async _update(id: string, user: Account) {
    const data = diff(getPgState(user), accountToPg(user));
    if (!data) {
      return;
    }

    await this.db.write
      //
      .updateTable('accounts')
      .set(data)
      .where('id', '=', id)
      .execute();
  }
}
