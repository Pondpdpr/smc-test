import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { DeleteUserResponse } from './delete-user/delete-user.dto';
import { DeleteUserCommand } from './delete-user/delete-user.query';
import { GetUserDto, GetUserResponse } from './get-user/get-user.dto';
import { GetUserQuery } from './get-user/get-user.query';
import { ListUsersDto, ListUsersResponse } from './list-users/list-users.dto';
import { ListUsersQuery } from './list-users/list-users.query';
import { UpdateUserCommand } from './update-user/update-user.command';
import {
  UpdateUserDto,
  UpdateUserResponse,
} from './update-user/update-user.dto';

@Controller({
  path: 'users',
  version: '1',
})
export class UsersV1Controller {
  constructor(
    private getUsersQuery: ListUsersQuery,
    private getUserQuery: GetUserQuery,
    private updateUserCommand: UpdateUserCommand,
    private deleteUserCommand: DeleteUserCommand,
  ) {}

  @Get()
  async getUsers(@Query() query: ListUsersDto): Promise<ListUsersResponse> {
    return this.getUsersQuery.exec(query);
  }

  @Get(':id')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetUserDto,
  ): Promise<GetUserResponse> {
    return this.getUserQuery.exec(id, query);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UpdateUserResponse> {
    return this.updateUserCommand.exec(id, body);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteUserResponse> {
    return this.deleteUserCommand.exec(id);
  }
}
