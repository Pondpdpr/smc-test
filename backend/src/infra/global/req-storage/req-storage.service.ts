import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import geoip from 'geoip-lite';

import { ApiException } from '@/shared/http/http.exception';

import type { ReqData, ReqInfo } from './req-storage.common';

@Injectable()
export class ReqStorage {
  private _localStorage = new AsyncLocalStorage<ReqData>();

  run<T>(trx: any, fn: () => T) {
    return this._localStorage.run(trx, fn);
  }

  get() {
    const ctx = this._localStorage.getStore();
    if (!ctx) {
      throw new ApiException(500, 'ctxMissing');
    }

    return ctx;
  }

  getReqInfo(): ReqInfo {
    const ctx = this.get();

    let device = ctx.device.toString();
    if (!device || device === 'undefined') {
      device = 'unknown';
    }

    return {
      ua: {
        device,
        ip: ctx.ip,
        browser: ctx.browser,
      },
      geoIp: geoip.lookup(ctx.ip),
    };
  }
}
