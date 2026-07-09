import { HttpException } from '@nestjs/common';
import type { Except } from 'type-fest';

import type { Info } from '../type/type.common';

export abstract class HttpBaseException extends HttpException {
  key: string;

  protected fields: Record<string, string[]>;
  protected context: Record<string, string>;
  abstract httpStatus: number;

  constructor(info: Info<string>) {
    super('Expected Http Exception', 0);
    this.key = info.key;
    this.fields = info.fields;
    this.context = info.context;
  }

  getContext() {
    return this.context;
  }
  getFields() {
    return this.fields;
  }
}

type ApiExceptionOptions = {
  info?: Partial<Except<Info<string>, 'key'>>;
  error?: unknown;
};

export class ApiException extends HttpBaseException {
  httpStatus: number;

  constructor(httpStatus: number, key: string, opts?: ApiExceptionOptions) {
    const context = opts?.info?.context || {};
    if (opts?.error) {
      const e = opts.error;
      context.message = e?.['message'] || 'noMessage';
      context.stack = e?.['stack'] || '';
    }

    const allInfo = {
      context,
      fields: opts?.info?.fields || {},
      key,
    };

    super(allInfo);
    this.httpStatus = httpStatus;
    if (key) {
      this.key = key;
    }
  }
}
