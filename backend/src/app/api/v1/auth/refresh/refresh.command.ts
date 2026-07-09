import { Injectable } from '@nestjs/common';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

import { Account } from '@/domain/base/account/account.domain';
import { accountFromPg } from '@/domain/base/account/account.mapper';
import { Session } from '@/domain/base/session/session.domain';
import { SessionService } from '@/domain/base/session/session.service';
import { sessionsTableFilter } from '@/domain/base/session/session.util';
import { User } from '@/domain/base/user/user.domain';
import { userFromPg, userToResponse } from '@/domain/base/user/user.mapper';
import { usersTableFilter } from '@/domain/base/user/user.util';
import { getAccessToken } from '@/domain/logic/auth/auth.util';
import { MainDb } from '@/infra/db/db.main';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { shaHashstring } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { RefreshResponse } from './refresh.dto';

type Entity = {
  user: User;
  account: Account;
  session: Session;
};

@Injectable()
export class RefreshCommand implements CommandInterface {
  constructor(
    private db: MainDb,

    private sessionService: SessionService,
    private transactionService: TransactionService,
  ) {}

  async exec(
    plainToken: string,
  ): Promise<{ plainToken: string; response: RefreshResponse }> {
    const { entity, token } = await this.find(plainToken);

    await this.save(entity);

    return {
      response: toHttpSuccess({
        data: {
          user: {
            attributes: userToResponse(entity.user),
          },
          token: getAccessToken({ user: entity.user, account: entity.account }),
        },
      }),
      plainToken: token,
    };
  }

  async save(entity: Entity): Promise<void> {
    await this.transactionService.transaction(async () => {
      await this.sessionService.save(entity.session);
      await this.sessionService.revokeAllOtherSession(entity.session);
    });
  }

  async find(plainToken: string): Promise<{ entity: Entity; token: string }> {
    const pg = await this.db.read
      .selectFrom('sessions')
      .selectAll('sessions')
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('accounts')
            .selectAll('accounts')
            .whereRef('accounts.id', '=', 'sessions.account_id'),
        ).as('account'),
      )
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('users')
            .where(usersTableFilter)
            .selectAll('users')
            .whereRef('users.account_id', '=', 'sessions.account_id'),
        ).as('user'),
      )
      .where('token_hash', '=', shaHashstring(plainToken))
      .where(sessionsTableFilter)
      .where('sessions.expire_at', '>', myDayjs().toISOString())
      .where('revoke_at', 'is', null)
      .executeTakeFirst();

    if (!pg || !pg.user || !pg.account) {
      throw new ApiException(403, 'invalidSessionToken');
    }

    const { session, token } = this.sessionService.newSession(pg.account_id);

    return {
      entity: {
        user: userFromPg(pg.user),
        account: accountFromPg(pg.account),
        session,
      },
      token,
    };
  }
}
