import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { Idempotency } from '@/infra/middleware/idempotent/idempotent.common';
import { UseIdempotent } from '@/infra/middleware/idempotent/idempotent.interceptor';
import { UsePublic } from '@/infra/middleware/jwt/jwt.common';
import {
  getRefreshCookie,
  setRefreshCookie,
} from '@/shared/common/common.cookie';
import { ApiException } from '@/shared/http/http.exception';

import { RefreshCommand } from './refresh/refresh.command';
import { RefreshResponse } from './refresh/refresh.dto';
import { ResendVerificationCommand } from './resend-verification/resend-verification.command';
import {
  ResendVerificationDto,
  ResendVerificationResponse,
} from './resend-verification/resend-verification.dto';
import { SignInCommand } from './sign-in/sign-in.command';
import { SignInDto, SignInResponse } from './sign-in/sign-in.dto';
import { SignUpCommand } from './sign-up/sign-up.command';
import { SignupDto, SignUpResponse } from './sign-up/sign-up.dto';
import { VerifyEmailCommand } from './verify-email/verify-email.command';
import {
  VerifyEmailDto,
  VerifyEmailResponse,
} from './verify-email/verify-email.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthV1Controller {
  constructor(
    private signInCommand: SignInCommand,
    private signUpCommand: SignUpCommand,
    private refreshCommand: RefreshCommand,
    private verifyEmailCommand: VerifyEmailCommand,
    private resendVerificationCommand: ResendVerificationCommand,
  ) {}

  @Post('sign-in')
  @UsePublic()
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<SignInResponse> {
    const { response, plainToken } = await this.signInCommand.exec(body);
    setRefreshCookie(res, plainToken);

    return response;
  }

  @Post('sign-up')
  @UsePublic()
  @UseIdempotent()
  async signUp(
    @Idempotency() idx: Idempotency,
    @Body() body: SignupDto,
  ): Promise<SignUpResponse> {
    return this.signUpCommand.exec(idx, body);
  }

  @Post('refresh')
  @UsePublic()
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<RefreshResponse> {
    const reqToken = getRefreshCookie(req);
    if (!reqToken) {
      throw new ApiException(403, 'invalidSessionToken');
    }

    const { response, plainToken } = await this.refreshCommand.exec(reqToken);
    setRefreshCookie(res, plainToken);

    return response;
  }

  @Post('verify-email')
  @UsePublic()
  async verifyEmail(
    @Body() body: VerifyEmailDto,
  ): Promise<VerifyEmailResponse> {
    return this.verifyEmailCommand.exec(body);
  }

  @Post('resend-verification')
  @UsePublic()
  async resendVerification(
    @Body() body: ResendVerificationDto,
  ): Promise<ResendVerificationResponse> {
    return this.resendVerificationCommand.exec(body);
  }
}
