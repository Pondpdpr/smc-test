import { Module } from '@nestjs/common';

import { DeleteUserCommand } from './delete-user/delete-user.query';
import { GetUserQuery } from './get-user/get-user.query';
import { ListUsersQuery } from './list-users/list-users.query';
import { UpdateUserCommand } from './update-user/update-user.command';
import { UsersV1Controller } from './users.v1.controller';

@Module({
  providers: [
    //
    ListUsersQuery,
    GetUserQuery,
    UpdateUserCommand,
    DeleteUserCommand,
  ],
  controllers: [UsersV1Controller],
})
export class UsersV1Module {}
