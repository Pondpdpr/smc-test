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
import { GetUserQueryInput, GetUserResponse } from './get-user.dto';

async function setup(app: INestApplication) {
  const accountService = app.get(AccountService);
  const userService = app.get(UserService);

  const sampleAccount = mockAccount();
  const sampleUser = mockUser({
    email: 'frank@test.com',
    firstName: 'Frank',
    lastName: 'Franklin',
    userStatus: 'ACTIVE',
    accountId: sampleAccount.id,
  });

  await accountService.save(sampleAccount);
  await userService.save(sampleUser);

  return { sampleUser };
}

describe('GET /v1/users/:id', () => {
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

  it('should get a user by id', async () => {
    const query: GetUserQueryInput = {};

    const { status, body } = await request(app.getHttpServer())
      .get(`/v1/users/${testData.sampleUser.id}`)
      .set(headers)
      .query(query);

    const { success, data } = body as GetUserResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.attributes.id).toBe(testData.sampleUser.id);
    expect(data.user.attributes.email).toBe('frank@test.com');
    expect(data.user.attributes.firstName).toBe('Frank');
    expect(data.user.attributes.lastName).toBe('Franklin');
    expect(data.user.attributes.userStatus).toBe('ACTIVE');
  });

  it('should return 404 for non-existent user', async () => {
    const query: GetUserQueryInput = {};
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const { status, body } = await request(app.getHttpServer())
      .get(`/v1/users/${fakeId}`)
      .set(headers)
      .query(query);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid UUID format', async () => {
    const query: GetUserQueryInput = {};
    const invalidId = 'not-a-valid-uuid';

    const { status, body } = await request(app.getHttpServer())
      .get(`/v1/users/${invalidId}`)
      .set(headers)
      .query(query);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});
