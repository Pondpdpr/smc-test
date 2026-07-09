import { Injectable } from '@nestjs/common';

import { EmailVerificationToken } from '@/domain/base/email-verification-token/email-verification-token.domain';
import { EmailVerificationTokenService } from '@/domain/base/email-verification-token/email-verification-token.service';
import { User } from '@/domain/base/user/user.domain';
import { userToResponse } from '@/domain/base/user/user.mapper';
import { UserService } from '@/domain/base/user/user.service';
import { markEmailVerified } from '@/domain/base/user/user.util';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { VerifyEmailDto, VerifyEmailResponse } from './verify-email.dto';

@Injectable()
export class VerifyEmailCommand implements CommandInterface {
  constructor(
    private emailVerificationTokenService: EmailVerificationTokenService,
    private userService: UserService,
    private transactionService: TransactionService,
  ) {}

  async exec(body: VerifyEmailDto): Promise<VerifyEmailResponse> {
    const token = await this.emailVerificationTokenService.findValidByToken(
      body.token,
    );
    if (!token) {
      throw new ApiException(400, 'invalidOrExpiredToken');
    }

    const user = await this.userService.findOne(token.userId);
    if (!user) {
      throw new ApiException(404, 'userNotFound');
    }

    const verifiedUser = markEmailVerified(user);

    await this.save(verifiedUser, token);

    return toHttpSuccess({
      data: {
        user: {
          attributes: userToResponse(verifiedUser),
        },
      },
    });
  }

  async save(verifiedUser: User, token: EmailVerificationToken) {
    await this.transactionService.transaction(async () => {
      await this.userService.save(verifiedUser);
      await this.emailVerificationTokenService.delete(token);
    });
  }
}
