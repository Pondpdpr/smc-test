import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, SetMetadata } from '@nestjs/common';

export const USER_CONTEXT = 'user';

export type UserJwtEncoded = {
  userId: string;
  accountId: string;
};

export type UserClaims = {
  userId: string;
  accountId: string;
};

export const IS_PUBLIC_KEY = 'isPublic';
export const UsePublic = () => SetMetadata(IS_PUBLIC_KEY, true);

export const UserClaims = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserClaims => {
    const req = ctx.switchToHttp().getRequest();
    const userCtx: UserJwtEncoded = req[USER_CONTEXT];

    return {
      userId: userCtx.userId,
      accountId: userCtx.accountId,
    };
  },
);
