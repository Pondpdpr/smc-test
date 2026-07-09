import { Injectable } from '@nestjs/common';

import { userPgToResponse } from '@/domain/base/user/user.mapper';
import { UserService } from '@/domain/base/user/user.service';
import { MainDb } from '@/infra/db/db.main';
import { filterQbIds } from '@/infra/db/db.util';
import { getPagination } from '@/shared/common/common.pagination';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { ListUsersDto, ListUsersResponse } from './list-users.dto';

@Injectable()
export class ListUsersQuery implements QueryInterface {
  constructor(
    private db: MainDb,
    private userService: UserService,
  ) {}

  async exec(query: ListUsersDto): Promise<ListUsersResponse> {
    const raw = await this.getRaw(query);

    const data: ListUsersResponse['data'] = {
      users: raw.result.map((data) => ({
        attributes: userPgToResponse(data),
      })),
    };

    return toHttpSuccess({
      data,
      meta: {
        pagination: getPagination(data.users, raw.totalCount, query.pagination),
      },
    });
  }

  async getRaw(query: ListUsersDto) {
    const ids = await this.userService.findIds({
      filter: query.filter,
      pagination: query.pagination,
      sort: query.sort,
    });

    if (!ids) {
      return {
        result: [],
        totalCount: 0,
      };
    }

    const result = await this.db.read
      .selectFrom('users')
      .selectAll()
      .$call((q) => filterQbIds(ids, q, 'users.id'))
      .execute();

    const totalCount = await this.userService.getCount(query.filter);

    return { result, totalCount };
  }
}
