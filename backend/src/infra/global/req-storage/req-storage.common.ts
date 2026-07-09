import type { Lookup } from 'geoip-lite';

import type { Locales } from '@/infra/i18n/i18n-types';

export type ReqData = {
  traceId: string;
  requestTime: string;
  agent: string;
  browser: string;
  device: UAParser.IDevice;
  deviceUid: string | null;
  os: string;
  ip: string;
  lang: Locales | null;
};

export type ReqInfo = {
  ua: {
    device: string;
    ip: string;
    browser: string;
  };
  geoIp: Lookup | null;
};
