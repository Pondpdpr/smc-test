import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { mockAccount } from '@/domain/base/account/account.factory';
import { AccountService } from '@/domain/base/account/account.service';
import { mockUser } from '@/domain/base/user/user.factory';
import { UserService } from '@/domain/base/user/user.service';
import {
  createBackendTestingModule,
  getBaseTestHeader,
  startE2e,
  stopE2e,
  testTransactionRollback,
  testTransactionStart,
} from '@/infra/test/test-util/test-util.common';

import { UsersV1Module } from '../users.v1.module';
import { DeleteUserResponse } from './delete-user.dto';

async function setup(app: INestApplication) {
  const accountService = app.get(AccountService);
  const userService = app.get(UserService);
  const sampleAccount = mockAccount();
  const sampleUser = mockUser({
    email: 'henry@test.com',
    firstName: 'Henry',
    lastName: 'Harris',
    userStatus: 'ACTIVE',
    accountId: sampleAccount.id,
  });

  await accountService.save(sampleAccount);
  await userService.save(sampleUser);

  return { sampleUser };
}

describe('DELETE /v1/users/:id', () => {
  let app: INestApplication;
  let headers: Record<string, string>;
  let testData: Awaited<ReturnType<typeof setup>>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(UsersV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);

    testData = await setup(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should delete a user by id', async () => {
    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/users/${testData.sampleUser.id}`)
      .set(headers);

    const { success, data } = body as DeleteUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.attributes.id).toBe(testData.sampleUser.id);
    expect(data.user.attributes.email).toBe('henry@test.com');
    expect(data.user.attributes.firstName).toBe('Henry');
    expect(data.user.attributes.lastName).toBe('Harris');
    expect(data.user.attributes.userStatus).toBe('ACTIVE');
  });

  it('should verify user is deleted by trying to get it', async () => {
    const userService = app.get(UserService);

    // Delete the user
    await request(app.getHttpServer())
      .delete(`/v1/users/${testData.sampleUser.id}`)
      .set(headers);

    // Try to get the deleted user
    const deletedUser = await userService.findOne(testData.sampleUser.id);

    expect(deletedUser).toBeNull();
  });

  it('should return 404 for non-existent user', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/users/${fakeId}`)
      .set(headers);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid';

    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/users/${invalidId}`)
      .set(headers);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('should return 404 when trying to delete already deleted user', async () => {
    // Delete the user first time
    await request(app.getHttpServer())
      .delete(`/v1/users/${testData.sampleUser.id}`)
      .set(headers);

    // Try to delete again
    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/users/${testData.sampleUser.id}`)
      .set(headers);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
