import { Injectable } from '@nestjs/common';

import { Account } from '@/domain/base/account/account.domain';
import { AccountService } from '@/domain/base/account/account.service';
import { newAccount } from '@/domain/base/account/account.util';
import { EmailVerificationToken } from '@/domain/base/email-verification-token/email-verification-token.domain';
import { EmailVerificationTokenService } from '@/domain/base/email-verification-token/email-verification-token.service';
import { newEmailVerificationToken } from '@/domain/base/email-verification-token/email-verification-token.util';
import { User } from '@/domain/base/user/user.domain';
import { userToResponse } from '@/domain/base/user/user.mapper';
import { UserService } from '@/domain/base/user/user.service';
import { newUser } from '@/domain/base/user/user.util';
import { signIn } from '@/domain/logic/auth/auth.util';
import { EmailVerificationQueue } from '@/domain/queue/email-verification/email-verification.queue';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { Idempotency } from '@/infra/middleware/idempotent/idempotent.common';
import { randHex } from '@/shared/common/common.crypto';
import { valueOr } from '@/shared/common/common.func';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { SignupDto, SignUpResponse } from './sign-up.dto';

type Entity = {
  account: Account;
  user: User;
  verificationToken: EmailVerificationToken;
};

@Injectable()
export class SignUpCommand implements CommandInterface {
  constructor(
    //
    private accountService: AccountService,
    private userService: UserService,
    private emailVerificationTokenService: EmailVerificationTokenService,
    private emailVerificationQueue: EmailVerificationQueue,
    private transactionService: TransactionService,
  ) {}

  async exec(idx: Idempotency, body: SignupDto): Promise<SignUpResponse> {
    let account = newAccount({
      username: body.account.username,
      password: body.account.password,
    });

    const user = newUser({
      accountId: account.id,
      email: valueOr(body.user.email, body.account.username),
      firstName: body.user.firstName,
      lastName: body.user.lastName,
    });

    account = signIn(account, body.account.password);

    // Raw token only ever lives in the email link - only its hash is persisted.
    const rawToken = randHex();
    const verificationToken = newEmailVerificationToken({
      userId: user.id,
      token: rawToken,
    });

    if (idx.isOriginal) {
      await this.save({ user, account, verificationToken });

      // Published after the transaction commits, so we never email a user
      // whose account write ended up rolling back.
      this.emailVerificationQueue.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        token: rawToken,
      });
    }

    // No access token here on purpose - sign-in is gated on email verification,
    // so registering alone must not hand out a usable session.
    return toHttpSuccess({
      data: {
        user: {
          attributes: userToResponse(user),
        },
      },
    });
  }

  async save({ user, account, verificationToken }: Entity) {
    await this.transactionService.transaction(async () => {
      await this.accountService.save(account);
      await this.userService.save(user);
      await this.emailVerificationTokenService.save(verificationToken);
    });
  }
}
