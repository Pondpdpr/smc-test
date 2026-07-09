import { shaHashstring, uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { valueOr } from '@/shared/common/common.func';

import { SESSION_DEFAULT_EXPIRY_SECONDS } from './session.constant';
import type { Session } from './session.domain';

export function mockSession(
  data?: Partial<Session> & { token?: string },
): Session {
  return {
    id: uuidV7(),
    accountId: valueOr(data?.accountId, uuidV7()),
    tokenHash: valueOr(shaHashstring(data?.token), shaHashstring('token')),
    deviceUid: valueOr(data?.deviceUid, 'test'),
    createdAt: myDayjs().toDate(),
    expireAt: valueOr(
      data?.expireAt,
      myDayjs().add(SESSION_DEFAULT_EXPIRY_SECONDS, 'seconds').toDate(),
    ),
    revokeAt: null,
    info: valueOr(data?.info, {
      geoIp: null,
      ua: { browser: '', device: '', ip: 'test' },
    }),
  };
}
