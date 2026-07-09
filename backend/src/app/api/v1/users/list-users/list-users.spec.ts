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
import { ListUsersQueryInput, ListUsersResponse } from './list-users.dto';

async function setup(app: INestApplication) {
  const accountService = app.get(AccountService);
  const userService = app.get(UserService);

  // Create users with constant test data
  const sampleAccounts = [mockAccount(), mockAccount(), mockAccount()];
  const sampleUsers = [
    mockUser({
      email: 'alice@test.com',
      firstName: 'Alice',
      lastName: 'Anderson',
      userStatus: 'ACTIVE',
      accountId: sampleAccounts[0].id,
    }),
    mockUser({
      email: 'bob@test.com',
      firstName: 'Bob',
      lastName: 'Brown',
      userStatus: 'ACTIVE',
      accountId: sampleAccounts[1].id,
    }),
    mockUser({
      email: 'charlie@test.com',
      firstName: 'Charlie',
      lastName: 'Chen',
      userStatus: 'ACTIVE',
      accountId: sampleAccounts[2].id,
    }),
  ];

  await accountService.saveBulk(sampleAccounts);
  await userService.saveBulk(sampleUsers);

  return { sampleUsers };
}

describe('GET /v1/users', () => {
  let app: INestApplication;
  let headers: Record<string, string>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(UsersV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);

    await setup(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should list all users', async () => {
    const query: ListUsersQueryInput = {};

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/users')
      .set(headers)
      .query(query);

    const { success, data } = body as ListUsersResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.users.length).toBe(4);

    // Verify user data
    const userEmails = data.users.map((u) => u.attributes.email).sort();
    expect(userEmails).toEqual([
      'alice@test.com',
      'bob@test.com',
      'charlie@test.com',
      'testuser@example.com',
    ]);

    const alice = data.users.find(
      (u) => u.attributes.email === 'alice@test.com',
    );
    expect(alice?.attributes.firstName).toBe('Alice');
    expect(alice?.attributes.lastName).toBe('Anderson');
    expect(alice?.attributes.userStatus).toBe('ACTIVE');
  });

  it('should support pagination', async () => {
    const query: ListUsersQueryInput = {
      pagination: {
        page: '1',
        perPage: '2',
      },
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/users')
      .set(headers)
      .query(query);

    const { success, data, meta } = body as ListUsersResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.users.length).toBe(2);
    expect(meta.pagination).toBeDefined();
    expect(meta.pagination.page).toBe(1);
    expect(meta.pagination.perPage).toBe(2);
  });

  it('should support sorting by firstName', async () => {
    const query: ListUsersQueryInput = {
      sort: 'firstName',
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/users')
      .set(headers)
      .query(query);

    const { success, data } = body as ListUsersResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.users.length).toBe(4);

    // Verify sorting - should be Alice, Bob, Charlie, Zebra
    expect(data.users[0].attributes.firstName).toBe('Alice');
    expect(data.users[1].attributes.firstName).toBe('Bob');
    expect(data.users[2].attributes.firstName).toBe('Charlie');
    expect(data.users[3].attributes.firstName).toBe('tester');
  });

  it('should support filtering by userStatus', async () => {
    const query: ListUsersQueryInput = {
      filter: {
        status: 'ACTIVE',
      },
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/users')
      .set(headers)
      .query(query);

    const { success, data } = body as ListUsersResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.users.length).toBe(4);

    // All returned users should be ACTIVE
    data.users.forEach((user) => {
      expect(user.attributes.userStatus).toBe('ACTIVE');
    });
  });

  it('should return empty array when no users match filter', async () => {
    const query: ListUsersQueryInput = {
      filter: {
        status: 'INACTIVE',
      },
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/users')
      .set(headers)
      .query(query);

    const { success, data } = body as ListUsersResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.users.length).toBe(0);
  });
});
