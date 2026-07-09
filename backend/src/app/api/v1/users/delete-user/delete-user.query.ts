import { Injectable } from '@nestjs/common';

import { User } from '@/domain/base/user/user.domain';
import { userToResponse } from '@/domain/base/user/user.mapper';
import { UserService } from '@/domain/base/user/user.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { DeleteUserResponse } from './delete-user.dto';

@Injectable()
export class DeleteUserCommand implements CommandInterface {
  constructor(private userService: UserService) {}

  async exec(id: string): Promise<DeleteUserResponse> {
    const user = await this.find(id);

    await this.save(user);

    return toHttpSuccess({
      data: {
        user: {
          attributes: userToResponse(user),
        },
      },
    });
  }

  async save(user: User) {
    await this.userService.delete(user);
  }

  async find(id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new ApiException(404, 'userNotFound');
    }

    return user;
  }
}
