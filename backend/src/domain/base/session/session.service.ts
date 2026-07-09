import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { MainDb } from '@/infra/db/db.main';
import { ReqStorage } from '@/infra/global/req-storage/req-storage.service';
import myDayjs from '@/shared/common/common.dayjs';
import {
  getPgState,
  isPersist,
  setPgState,
} from '@/shared/common/common.domain';
import { diff } from '@/shared/common/common.func';
import { ApiException } from '@/shared/http/http.exception';

import { Session } from './session.domain';
import { sessionFromPg, sessionToPg } from './session.mapper';
import { newSession } from './session.util';

@Injectable()
export class SessionService {
  constructor(
    private db: MainDb,
    private reqStorage: ReqStorage,
  ) {}

  newSession(accountId: string) {
    const token = randomBytes(32).toString('hex');
    const { deviceUid } = this.reqStorage.get();
    if (!deviceUid) {
      throw new ApiException(400, 'noDeviceUid');
    }

    const session = newSession({
      token,
      accountId,
      deviceUid,
      info: this.reqStorage.getReqInfo(),
    });

    return {
      token,
      session,
    };
  }

  async findOne(id: string) {
    const pg = await this.db.read
      .selectFrom('sessions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!pg) return null;
    return sessionFromPg(pg);
  }

  async save(session: Session) {
    this._validate(session);
    if (!isPersist(session)) {
      await this._create(session);
    } else {
      await this._update(session.id, session);
    }
    setPgState(session, sessionToPg(session));
  }

  async saveBulk(sessions: Session[]) {
    return Promise.all(sessions.map((s) => this.save(s)));
  }

  async delete(id: string) {
    await this.db.write.deleteFrom('sessions').where('id', '=', id).execute();
  }

  async revokeAllOtherSession(session: Session) {
    await this.db.write
      .updateTable('sessions')
      .set('revoke_at', myDayjs().toISOString())
      .where('device_uid', '=', session.deviceUid)
      .where('account_id', '=', session.accountId)
      .where('id', '!=', session.id)
      .execute();
  }

  private _validate(_session: Session) {
    // validation rules
  }

  private async _create(session: Session) {
    await this.db.write
      .insertInto('sessions')
      .values(sessionToPg(session))
      .execute();
  }

  private async _update(id: string, session: Session) {
    const data = diff(getPgState(session), sessionToPg(session));
    if (!data) return;
    await this.db.write
      .updateTable('sessions')
      .set(data)
      .where('id', '=', id)
      .execute();
  }
}
