import { createZodValidationPipe } from 'nestjs-zod';
import type { ZodError } from 'zod';

import { setNestedKey } from '@/shared/common/common.func';
import { ApiException } from '@/shared/http/http.exception';

export const CoreZodValidationPipe: any = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: unknown) => {
    const zodError = error as ZodError;
    const fields = {};
    for (const err of zodError.issues) {
      setNestedKey(fields, err.path, err.message);
    }

    let message = 'invalidJson';
    if (!Object.keys(fields).length) {
      message = zodError?.issues?.[0].message || message;
    }

    return new ApiException(400, message, {
      info: { fields, context: {} },
    });
  },
});
