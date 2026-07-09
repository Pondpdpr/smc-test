import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { AppConfig } from '@/infra/config';
import { decodeUserJwt } from '@/shared/common/common.crypto';
import { ApiException } from '@/shared/http/http.exception';
import { AUTH_HEADER } from '@/shared/http/http.headers';

import { IS_PUBLIC_KEY, USER_CONTEXT } from './jwt.common';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const jwtConfig = this.configService.getOrThrow<AppConfig['jwt']>('jwt');

    const token = this._extractTokenFromHeader(request);
    if (!token) {
      throw new ApiException(401, 'invalidToken');
    }

    const claims = decodeUserJwt(token, jwtConfig.salt);
    request[USER_CONTEXT] = claims?.message;

    return true;
  }

  private _extractTokenFromHeader(request: FastifyRequest): string | null {
    const authHeader = request.headers[AUTH_HEADER];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1]; // Extract token after "Bearer "
  }
}
