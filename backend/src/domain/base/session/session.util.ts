import type { EB } from '@/infra/db/db.common';
import { shaHashstring, uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import { SESSION_DEFAULT_EXPIRY_SECONDS } from './session.constant';
import type {
  Session,
  SessionNewData,
  SessionUpdateData,
} from './session.domain';

export function sessionsTableFilter(eb: EB<'sessions'>) {
  return eb.and([]);
}

export function newSession(data: SessionNewData): Session {
  return {
    id: uuidV7(),
    accountId: data.accountId,
    tokenHash: shaHashstring(data.token),
    deviceUid: data.deviceUid,
    createdAt: myDayjs().toDate(),
    expireAt: valueOr(
      data.expireAt,
      myDayjs().add(SESSION_DEFAULT_EXPIRY_SECONDS, 'seconds').toDate(),
    ),
    revokeAt: null,
    info: data.info,
  };
}

export function newSessions(data: SessionNewData[]): Session[] {
  return data.map((d) => newSession(d));
}

export function editSession(entity: Session, data: SessionUpdateData): Session {
  return {
    [$pgState]: getPgState(entity),
    id: entity.id,
    accountId: entity.accountId,
    createdAt: entity.createdAt,

    // Update
    tokenHash: valueOr(data.tokenHash, entity.tokenHash),
    deviceUid: valueOr(data.deviceUid, entity.deviceUid),
    expireAt: valueOr(data.expireAt, entity.expireAt),
    revokeAt: valueOr(data.revokeAt, entity.revokeAt),
    info: valueOr(data.info, entity.info),
  };
}
