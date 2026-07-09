import { Injectable } from '@nestjs/common';

import { EmailVerificationToken } from '@/domain/base/email-verification-token/email-verification-token.domain';
import { EmailVerificationTokenService } from '@/domain/base/email-verification-token/email-verification-token.service';
import { newEmailVerificationToken } from '@/domain/base/email-verification-token/email-verification-token.util';
import { UserService } from '@/domain/base/user/user.service';
import { EmailVerificationQueue } from '@/domain/queue/email-verification/email-verification.queue';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { randHex } from '@/shared/common/common.crypto';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import {
  ResendVerificationDto,
  ResendVerificationResponse,
} from './resend-verification.dto';

@Injectable()
export class ResendVerificationCommand implements CommandInterface {
  constructor(
    private userService: UserService,
    private emailVerificationTokenService: EmailVerificationTokenService,
    private emailVerificationQueue: EmailVerificationQueue,
    private transactionService: TransactionService,
  ) {}

  async exec(body: ResendVerificationDto): Promise<ResendVerificationResponse> {
    const user = await this.userService.findByEmail(body.email);

    // Always return the same response whether or not the email exists /
    // is already verified - don't leak account existence to an anonymous caller.
    if (user && !user.emailVerifiedAt) {
      const rawToken = randHex();
      const verificationToken = newEmailVerificationToken({
        userId: user.id,
        token: rawToken,
      });

      await this.save(user.id, verificationToken);

      this.emailVerificationQueue.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        token: rawToken,
      });
    }

    return toHttpSuccess({
      data: { sent: true },
    });
  }

  async save(userId: string, verificationToken: EmailVerificationToken) {
    await this.transactionService.transaction(async () => {
      await this.emailVerificationTokenService.deleteAllForUser(userId);
      await this.emailVerificationTokenService.save(verificationToken);
    });
  }
}
