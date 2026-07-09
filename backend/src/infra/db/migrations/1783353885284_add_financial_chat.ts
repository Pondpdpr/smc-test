import { type Kysely, sql } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Reference data from data/financial_data.sql (48 US companies, 2022-2025).
  // Loaded separately via a seed script after this migration runs - see
  // scripts/load-financial-data (COPY-compatible column order/names below).
  await db.schema
    .createTable('financial_data')
    .addColumn('company', 'text', (col) => col.notNull())
    .addColumn('ticker', 'text', (col) => col.notNull())
    .addColumn('sector', 'text', (col) => col.notNull())
    .addColumn('year', 'integer', (col) => col.notNull())
    .addColumn('revenue', 'int8')
    .addColumn('net_income', 'int8')
    .addColumn('operating_income', 'int8')
    .addColumn('gross_profit', 'int8')
    .addPrimaryKeyConstraint('pk_financial_data', ['company', 'year'])
    .execute();

  await db.schema
    .createIndex('idx_financial_data_ticker')
    .on('financial_data')
    .column('ticker')
    .execute();

  await db.schema
    .createTable('conversations')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').notNull().onDelete('cascade'),
    )
    .addColumn('title', 'text', (col) =>
      col.notNull().defaultTo('New conversation'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_conversations_user_id')
    .on('conversations')
    .column('user_id')
    .execute();

  await db.schema
    .createType('message_role')
    .asEnum(['user', 'assistant'])
    .execute();

  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('conversation_id', 'uuid', (col) =>
      col.references('conversations.id').notNull().onDelete('cascade'),
    )
    .addColumn('role', sql`message_role`, (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    // The visibly-rendered SQL tool call (query + result), if the assistant ran one.
    .addColumn('tool_call', 'jsonb')
    // True if generation was stopped mid-stream by the user (S3) - the partial
    // content is still saved and still counted towards usage (cost_usd below).
    .addColumn('stopped', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('cost_usd_micros', 'int8', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_messages_conversation_id_created_at')
    .on('messages')
    .columns(['conversation_id', 'created_at'])
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('messages').execute();
  await db.schema.dropType('message_role').execute();
  await db.schema.dropTable('conversations').execute();
  await db.schema.dropTable('financial_data').execute();
}
