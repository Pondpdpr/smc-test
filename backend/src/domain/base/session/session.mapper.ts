import type { JsonValue } from '@/infra/db/db';
import { ReqInfo } from '@/infra/global/req-storage/req-storage.common';
import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import {
  toDate,
  toISO,
  toResponseDate,
} from '@/shared/common/common.transformer';

import type { SessionJson, SessionPg } from './session.domain';
import { Session, SessionResponse } from './session.domain';

export function sessionFromPg(pg: SessionPg): Session {
  const session: Session = {
    id: pg.id,
    accountId: pg.account_id,
    tokenHash: pg.token_hash,
    deviceUid: pg.device_uid,
    createdAt: toDate(pg.created_at),
    expireAt: toDate(pg.expire_at),
    revokeAt: toDate(pg.revoke_at),
    info: pg.info as ReqInfo,
  };
  return setPgState(session, pg);
}

export function sessionFromJson(data: SessionJson): Session {
  return {
    id: data.id,
    accountId: data.accountId,
    tokenHash: data.tokenHash,
    deviceUid: data.deviceUid,
    createdAt: toDate(data.createdAt),
    expireAt: toDate(data.expireAt),
    revokeAt: toDate(data.revokeAt),
    info: data.info as ReqInfo,
    [$pgState]: getPgState(data),
  };
}

export function sessionToPg(s: Session): SessionPg {
  return {
    id: s.id,
    account_id: s.accountId,
    token_hash: s.tokenHash,
    device_uid: s.deviceUid,
    created_at: toISO(s.createdAt),
    expire_at: toISO(s.expireAt),
    revoke_at: toISO(s.revokeAt),
    info: s.info as JsonValue,
  };
}

export function sessionToResponse(s: Session): SessionResponse {
  return {
    id: s.id,
    createdAt: toResponseDate(s.createdAt),
    expireAt: toResponseDate(s.expireAt),
    revokeAt: toResponseDate(s.revokeAt),
  };
}

export function sessionToJson(s: Session): SessionJson {
  return {
    id: s.id,
    accountId: s.accountId,
    tokenHash: s.tokenHash,
    deviceUid: s.deviceUid,
    createdAt: toISO(s.createdAt),
    expireAt: toISO(s.expireAt),
    revokeAt: toISO(s.revokeAt),
    info: s.info,
    [$pgState]: getPgState(s),
  };
}
