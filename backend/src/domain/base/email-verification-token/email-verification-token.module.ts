import { Module } from '@nestjs/common';

import { EmailVerificationTokenService } from './email-verification-token.service';

@Module({
  providers: [EmailVerificationTokenService],
  exports: [EmailVerificationTokenService],
})
export class EmailVerificationTokenModule {}
