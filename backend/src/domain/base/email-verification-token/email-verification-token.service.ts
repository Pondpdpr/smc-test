import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import { shaHashstring } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { isPersist, setPgState } from '@/shared/common/common.domain';

import { EmailVerificationToken } from './email-verification-token.domain';
import {
  emailVerificationTokenFromPg,
  emailVerificationTokenToPg,
} from './email-verification-token.mapper';

@Injectable()
export class EmailVerificationTokenService {
  constructor(private db: MainDb) {}

  // Looks up by the raw token (as received from the verification link),
  // returning null if it doesn't exist, was already used, or has expired.
  async findValidByToken(rawToken: string) {
    const tokenHash = shaHashstring(rawToken);

    const pg = await this.db.read
      .selectFrom('email_verification_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('expires_at', '>', myDayjs().toISOString())
      .executeTakeFirst();

    if (!pg) {
      return null;
    }

    return emailVerificationTokenFromPg(pg);
  }

  // Single-use: consuming a token deletes its row entirely.
  async delete(token: EmailVerificationToken) {
    await this.db.write
      .deleteFrom('email_verification_tokens')
      .where('id', '=', token.id)
      .execute();
  }

  // Only one valid token per user at a time - called before issuing a new
  // one (both on sign-up and on resend).
  async deleteAllForUser(userId: string) {
    await this.db.write
      .deleteFrom('email_verification_tokens')
      .where('user_id', '=', userId)
      .execute();
  }

  async save(token: EmailVerificationToken) {
    if (!isPersist(token)) {
      await this._create(token);
    }

    setPgState(token, emailVerificationTokenToPg(token));
  }

  private async _create(token: EmailVerificationToken) {
    await this.db.write
      .insertInto('email_verification_tokens')
      .values(emailVerificationTokenToPg(token))
      .execute();
  }
}
