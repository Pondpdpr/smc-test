import { type Kysely, sql } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('email_verified_at', 'timestamptz')
    .execute();

  // Single-use, short-lived tokens: a row existing = valid & unused - verifying
  // deletes the row rather than tracking a used_at flag.
  await db.schema
    .createTable('email_verification_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').notNull().onDelete('cascade'),
    )
    .addColumn('token_hash', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_email_verification_tokens_token_hash')
    .on('email_verification_tokens')
    .column('token_hash')
    .execute();

  await db.schema
    .createIndex('idx_email_verification_tokens_user_id')
    .on('email_verification_tokens')
    .column('user_id')
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('email_verification_tokens').execute();
  await db.schema.alterTable('users').dropColumn('email_verified_at').execute();
}
