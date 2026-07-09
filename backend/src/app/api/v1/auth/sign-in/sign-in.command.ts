import { Injectable } from '@nestjs/common';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

import { Account } from '@/domain/base/account/account.domain';
import { accountFromPg } from '@/domain/base/account/account.mapper';
import { AccountService } from '@/domain/base/account/account.service';
import { Session } from '@/domain/base/session/session.domain';
import { SessionService } from '@/domain/base/session/session.service';
import { User } from '@/domain/base/user/user.domain';
import { userFromPg, userToResponse } from '@/domain/base/user/user.mapper';
import { UserService } from '@/domain/base/user/user.service';
import { getAccessToken, signIn } from '@/domain/logic/auth/auth.util';
import { MainDb } from '@/infra/db/db.main';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { SignInDto, SignInResponse } from './sign-in.dto';

type Entity = {
  user: User;
  account: Account;
  session: Session;
};

@Injectable()
export class SignInCommand implements CommandInterface {
  constructor(
    private db: MainDb,
    private sessionService: SessionService,
    private userService: UserService,
    private accountService: AccountService,
    private transactionService: TransactionService,
  ) {}

  async exec(
    body: SignInDto,
  ): Promise<{ plainToken: string; response: SignInResponse }> {
    const { entity, token } = await this.find(body.username);
    entity.account = signIn(entity.account, body.password);

    if (!entity.user.emailVerifiedAt) {
      throw new ApiException(403, 'emailNotVerified');
    }

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

  async find(username: string): Promise<{ entity: Entity; token: string }> {
    const pg = await this.db.read
      //
      .selectFrom('accounts')
      .selectAll('accounts')
      .select((q) =>
        jsonObjectFrom(
          q
            .selectFrom('users')
            .selectAll()
            .whereRef('users.account_id', '=', 'accounts.id'),
        )
          .$notNull()
          .as('user'),
      )
      .where('username', '=', username)
      .executeTakeFirst();

    if (!pg) {
      throw new ApiException(400, 'usersNotFound');
    }

    const account = accountFromPg(pg);
    const { session, token } = this.sessionService.newSession(account.id);

    return {
      entity: {
        user: userFromPg(pg.user),
        account: accountFromPg(pg),
        session,
      },
      token,
    };
  }

  async save({ user, session, account }: Entity) {
    await this.transactionService.transaction(async () => {
      await this.accountService.save(account);
      await this.userService.save(user);
      await this.sessionService.save(session);
      await this.sessionService.revokeAllOtherSession(session);
    });
  }
}
