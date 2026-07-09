import { Module } from '@nestjs/common';

import { AuthV1Controller } from './auth.v1.controller';
import { RefreshCommand } from './refresh/refresh.command';
import { ResendVerificationCommand } from './resend-verification/resend-verification.command';
import { SignInCommand } from './sign-in/sign-in.command';
import { SignUpCommand } from './sign-up/sign-up.command';
import { VerifyEmailCommand } from './verify-email/verify-email.command';

@Module({
  controllers: [AuthV1Controller],
  providers: [
    SignInCommand,
    SignUpCommand,
    RefreshCommand,
    VerifyEmailCommand,
    ResendVerificationCommand,
  ],
})
export class AuthV1Module {}
