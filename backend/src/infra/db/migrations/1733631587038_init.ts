import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('message_status')
    .asEnum(['INVALID_PAYLOAD', 'FAIL', 'SUCCESS', 'DEAD'])
    .execute();

  await db.schema
    .createType('users_status')
    .asEnum(['ACTIVE', 'INACTIVE'])
    .execute();

  await db.schema
    .createTable('accounts')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('username', 'text', (col) => col.unique().notNull())
    .addColumn('password', 'text', (col) => col.notNull())
    .addColumn('last_signed_in_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.unique().notNull())
    .addColumn('first_name', 'text', (col) => col.notNull())
    .addColumn('last_name', 'text', (col) => col.notNull())
    .addColumn('account_id', 'uuid', (col) =>
      col.references('accounts.id').notNull().unique().onDelete('cascade'),
    )
    .addColumn('user_status', sql`users_status`, (col) =>
      col.notNull().defaultTo('ACTIVE'),
    )
    .execute();

  await db.schema
    .createIndex('idx_users_account_id')
    .on('users')
    .column('account_id')
    .execute();

  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('account_id', 'uuid', (col) =>
      col.references('accounts.id').notNull().onDelete('cascade'),
    )
    .addColumn('token_hash', 'text', (col) => col.notNull())
    .addColumn('device_uid', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('expire_at', 'timestamptz', (col) => col.notNull())
    .addColumn('revoke_at', 'timestamptz')
    .addColumn('info', 'jsonb', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('sessions_token_hash')
    .on('sessions')
    .column('token_hash')
    .execute();

  await db.schema
    .createType('file_expose_type')
    .asEnum(['PUBLIC', 'PRESIGN', 'PRIVATE'])
    .execute();

  await db.schema
    .createTable('stored_files')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('ref_name', 'text', (col) => col.notNull())
    .addColumn('key_path', 'text', (col) => col.notNull())
    .addColumn('owner_table', 'text', (col) => col.notNull())
    .addColumn('owner_id', 'uuid', (col) => col.notNull())
    .addColumn('filename', 'text', (col) => col.notNull())
    .addColumn('filesize_byte', 'int8', (col) => col.notNull())
    .addColumn('storage_name', 'text', (col) => col.notNull().defaultTo('s3'))
    .addColumn('presign_url', 'text', (col) => col.notNull())
    .addColumn('file_expose_type', sql`file_expose_type`, (col) =>
      col.notNull().defaultTo('PRESIGN'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('mime_type', 'text', (col) => col.notNull())
    .addColumn('extension', 'text', (col) => col.notNull())
    .addColumn('checksum', 'text')
    .addColumn('expire_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('message_tasks')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('queue_name', 'text', (col) => col.notNull())
    .addColumn('exchange_name', 'text', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('message_status', sql`message_status`, (col) => col.notNull())
    .addColumn('attempts', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('max_attempts', 'integer', (col) => col.notNull().defaultTo(5))
    .addColumn('last_error', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('expire_at', 'timestamptz', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('message_tasks').execute();
  await db.schema.dropTable('stored_files').execute();
  await db.schema.dropTable('sessions').execute();
  await db.schema.dropTable('users').execute();

  await db.schema.dropIndex('sessions_token_hash').execute();

  await db.schema.dropType('users_status').execute();
  await db.schema.dropType('message_status').execute();
}
