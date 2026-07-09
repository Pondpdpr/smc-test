import { Injectable } from '@nestjs/common';

import { userPgToResponse } from '@/domain/base/user/user.mapper';
import { MainDb } from '@/infra/db/db.main';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { GetUserDto, GetUserResponse } from './get-user.dto';

@Injectable()
export class GetUserQuery implements QueryInterface {
  constructor(private db: MainDb) {}

  async exec(id: string, _query: GetUserDto): Promise<GetUserResponse> {
    const raw = await this.getRaw(id);

    const data: GetUserResponse['data'] = {
      user: {
        attributes: userPgToResponse(raw),
      },
    };

    return toHttpSuccess({
      data,
    });
  }

  async getRaw(id: string) {
    const result = await this.db.read
      .selectFrom('users')
      .selectAll()
      .where('users.id', '=', id)
      .executeTakeFirst();

    if (!result) {
      throw new ApiException(404, 'userNotFound');
    }

    return result;
  }
}
