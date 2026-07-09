import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IDEMPOTENT_CONTEXT = '_idempotent';
export type Idempotency = {
  key: string;
  isOriginal: boolean;
};

export const Idempotency = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Idempotency => {
    const req = ctx.switchToHttp().getRequest();
    return req[IDEMPOTENT_CONTEXT];
  },
);
