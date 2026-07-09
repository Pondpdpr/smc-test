import type { Sessions } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import { ReqInfo } from '@/infra/global/req-storage/req-storage.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

type SessionPlain = {
  readonly id: string;
  readonly accountId: string;
  tokenHash: string;
  deviceUid: string;
  readonly createdAt: Date;
  expireAt: Date;
  revokeAt: Date | null;
  info: ReqInfo;
};

export type SessionPg = DBModel<Sessions>;
export type Session = WithState<SessionPg> & SessionPlain;
export type SessionJson = WithState<SessionPg> & Serialized<SessionPlain>;

export type SessionResponse = {
  id: string;
  createdAt: string;
  expireAt: string | null;
  revokeAt: string | null;
};

export type SessionNewData = {
  accountId: string;
  token: string;
  deviceUid: string;
  expireAt?: Date;
  info: ReqInfo;
};

export type SessionUpdateData = {
  tokenHash?: string;
  deviceUid?: string;
  expireAt?: Date;
  revokeAt?: Date | null;
  info?: any;
};
