import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import {
  addPagination,
  getDbErrorKey,
  queryCount,
  sortQb,
} from '@/infra/db/db.util';
import {
  getPgState,
  isPersist,
  setPgState,
} from '@/shared/common/common.domain';
import { diff, getUniqueIds } from '@/shared/common/common.func';
import { isDefined } from '@/shared/common/common.validator';
import { ApiException } from '@/shared/http/http.exception';

import { User } from './user.domain';
import { userFromPg, userToPg } from './user.mapper';
import { usersTableFilter } from './user.util';
import { UserFilterOptions, UserQueryOptions } from './user.zod';

@Injectable()
export class UserService {
  constructor(private db: MainDb) {}

  async findIds(opts?: UserQueryOptions) {
    opts ??= {};

    const { filter, sort, pagination } = opts;

    const res = await this._getFilterQb(filter)
      .select('users.id')
      .$if(!!sort?.length, (q) =>
        sortQb(q, sort, {
          id: 'users.id',
          createdAt: 'accounts.created_at',
          lastSignedInAt: 'accounts.last_signed_in_at',
          firstName: 'users.first_name',
          lastName: 'users.last_name',
          email: 'users.email',
        }),
      )
      .$call((q) => addPagination(q, pagination))
      .execute();

    return getUniqueIds(res);
  }

  async getCount(filter?: UserFilterOptions) {
    const totalCount = await this
      //
      ._getFilterQb(filter)
      .$call((q) => queryCount(q));

    return totalCount;
  }

  async findOne(id: string) {
    const userPg = await this.db.read
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!userPg) {
      return null;
    }

    const user = userFromPg(userPg);

    return user;
  }

  async delete(user: User) {
    await this.db.write
      //
      .deleteFrom('users')
      .where('id', '=', user.id)
      .execute();
  }

  async findByEmail(email: string) {
    const userPg = await this.db.read
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!userPg) {
      return null;
    }

    const user = userFromPg(userPg);

    return user;
  }

  async save(user: User) {
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
        throw new ApiException(400, 'emailExists');
      }
    }

    setPgState(user, userToPg(user));
  }

  async saveBulk(users: User[]) {
    return Promise.all(users.map((ud) => this.save(ud)));
  }

  private _validate(_user: User) {
    // no rule for now
  }

  private async _create(user: User) {
    await this.db.write.insertInto('users').values(userToPg(user)).execute();
  }

  private async _update(id: string, user: User) {
    const data = diff(getPgState(user), userToPg(user));
    if (!data) {
      return;
    }

    await this.db.write
      .updateTable('users')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  private _getFilterQb(filter?: UserFilterOptions) {
    return this.db.read
      .selectFrom('users')
      .where(usersTableFilter)
      .$if(isDefined(filter?.firstName), (q) =>
        q.where('users.first_name', '=', filter!.firstName!),
      )
      .$if(isDefined(filter?.lastName), (q) =>
        q.where('users.last_name', '=', filter!.lastName!),
      )
      .$if(isDefined(filter?.status), (q) =>
        q.where('users.user_status', '=', filter!.status!),
      )
      .$if(isDefined(filter?.email), (q) =>
        q.where('users.email', '=', filter!.email!),
      )
      .$if(isDefined(filter?.search), (q) => {
        const search = `%${filter!.search!}%`;

        return q.where((eb) =>
          eb.or([
            //
            eb('users.first_name', 'ilike', search),
            eb('users.last_name', 'ilike', search),
            eb('users.email', 'ilike', search),
          ]),
        );
      });
  }
}
