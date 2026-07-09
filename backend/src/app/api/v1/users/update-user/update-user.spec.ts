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
import { UpdateUserResponse } from './update-user.dto';

async function setup(app: INestApplication) {
  const accountService = app.get(AccountService);
  const userService = app.get(UserService);

  const sampleAccount = mockAccount();
  const sampleUser = mockUser({
    email: 'grace@test.com',
    firstName: 'Grace',
    lastName: 'Green',
    userStatus: 'ACTIVE',
    accountId: sampleAccount.id,
  });

  await accountService.save(sampleAccount);
  await userService.save(sampleUser);

  return { sampleUser };
}

describe('PATCH /v1/users/:id', () => {
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

  it('should update user firstName', async () => {
    const updateData = {
      firstName: 'UpdatedGrace',
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.attributes.id).toBe(testData.sampleUser.id);
    expect(data.user.attributes.firstName).toBe('UpdatedGrace');
    expect(data.user.attributes.lastName).toBe('Green');
    expect(data.user.attributes.email).toBe('grace@test.com');
  });

  it('should update user lastName', async () => {
    const updateData = {
      lastName: 'UpdatedGreen',
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user.attributes.lastName).toBe('UpdatedGreen');
    // update from last test
    expect(data.user.attributes.firstName).toBe('UpdatedGrace');
  });

  it('should update user userStatus', async () => {
    const updateData = {
      userStatus: 'INACTIVE' as const,
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user.attributes.userStatus).toBe('INACTIVE');
  });

  it('should update multiple fields at once', async () => {
    const updateData = {
      firstName: 'NewGrace',
      lastName: 'NewGreen',
      userStatus: 'INACTIVE' as const,
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user.attributes.firstName).toBe('NewGrace');
    expect(data.user.attributes.lastName).toBe('NewGreen');
    expect(data.user.attributes.userStatus).toBe('INACTIVE');
  });

  it('should succeed with empty update object', async () => {
    const updateData = {};

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user.attributes.id).toBe(testData.sampleUser.id);
    expect(data.user.attributes.email).toBe('grace@test.com');
  });

  it('should return 404 for non-existent user', async () => {
    const updateData = {
      firstName: 'Test',
    };
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${fakeId}`)
      .set(headers)
      .send(updateData);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid UUID format', async () => {
    const updateData = {
      firstName: 'Test',
    };
    const invalidId = 'not-a-valid-uuid';

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${invalidId}`)
      .set(headers)
      .send(updateData);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('should fail with invalid userStatus', async () => {
    const updateData = {
      userStatus: 'INVALID_STATUS',
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .send(updateData);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});
