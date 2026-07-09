import { Injectable } from '@nestjs/common';

import { User } from '@/domain/base/user/user.domain';
import { userToResponse } from '@/domain/base/user/user.mapper';
import { UserService } from '@/domain/base/user/user.service';
import { editUser } from '@/domain/base/user/user.util';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { UpdateUserDto, UpdateUserResponse } from './update-user.dto';

@Injectable()
export class UpdateUserCommand implements CommandInterface {
  constructor(private userService: UserService) {}

  async exec(id: string, body: UpdateUserDto): Promise<UpdateUserResponse> {
    let user = await this.find(id);
    user = editUser(user, body);

    await this.save(user);

    return toHttpSuccess({
      data: { user: { attributes: userToResponse(user) } },
    });
  }

  async find(id: string): Promise<User> {
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new ApiException(404, 'notFound');
    }

    return user;
  }

  async save(user: User) {
    await this.userService.save(user);
  }
}
