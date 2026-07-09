# Domain Creation Guide - Complete Self-Contained Documentation

## Table of Contents
1. [Overview](#overview)
2. [Domain Types](#domain-types)
3. [File Structure](#file-structure)
4. [Normal Table Domain (Complete Pattern)](#normal-table-domain)
5. [Many-to-Many Domain (Complete Pattern)](#many-to-many-domain)
6. [Post-Creation Steps](#post-creation-steps)

---

## Overview

This guide provides complete instructions for creating domain modules in a NestJS + Kysely TypeScript project. Each domain represents a database table and includes a complete set of files for type safety, business logic, data transformation, and persistence. Database schema can be reference using the file schema.dbml. This guide should be sufficient enough for creating any domain without needing to reference other files except schema.dbml, don't try to reference any other file except schema.dbml since they might be incomplete. Adapt patterns based on specific table structure and business requirements.

**Key Architecture Principles:**
- **Domain-Driven Design**: Each table gets its own domain module
- **Type Safety**: Full TypeScript coverage from DB to API response
- **Persistence State Tracking**: Entities track whether they exist in DB
- **Immutability by Default**: Domain entities use `readonly` properties
- **Snake-case to camelCase**: DB fields use snake_case, domain uses camelCase

---

## Domain Types

### 1. Normal Table Domain
**Characteristics:**
- Has a single column primary key (typically `id` UUID)
- Contains business entity data
- Requires full CRUD operations
- **Examples:** users, posts, accounts, sessions, comments

### 2. Many-to-Many Domain
**Characteristics:**
- Has a composite primary key (2 columns)
- Represents relationships between two entities
- Typically insert/delete only (no update)
- Simpler structure than normal domains
- **Examples:** post_mentions, user_roles, product_tags

**How to Identify:**
- Check the database schema for the primary key
- Composite PK = Many-to-Many domain
- Single `id` PK = Normal domain

---

## File Structure

Every domain follows this exact structure in `src/domain/base/{domain-name}/`:

### Normal Table Domain (8 files):
```
{domain-name}/
├── {domain-name}.domain.ts    # Domain entity class with business logic
├── {domain-name}.factory.ts   # Factory functions for creating new instances
├── {domain-name}.mapper.ts    # Data transformation functions (Pg↔Plain↔Json↔Response)
├── {domain-name}.module.ts    # NestJS module definition
├── {domain-name}.service.ts   # Database operations and persistence logic
├── {domain-name}.type.ts      # TypeScript type definitions
├── {domain-name}.util.ts      # Helper functions and constants
└── {domain-name}.zod.ts       # Zod schemas for validation and filtering
```

### Many-to-Many Domain (6 files):
```
{domain-name}/
├── {domain-name}.domain.ts    # Domain entity class (simpler, no edit method)
├── {domain-name}.factory.ts   # Factory functions for creating new instances
├── {domain-name}.mapper.ts    # Data transformation functions
├── {domain-name}.module.ts    # NestJS module definition
├── {domain-name}.service.ts   # Relationship management operations
└── {domain-name}.type.ts      # TypeScript type definitions
```

---

## Normal Table Domain

Use this pattern for standard database tables with a single `id` primary key.

### File 1: `{domain-name}.domain.ts`

**Purpose:** Define the domain entity class with business logic

**Pattern:**
```typescript
import { DomainEntity } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type { {Entity}Pg, {Entity}Plain, {Entity}UpdateData } from './{domain-name}.type';

export class {Entity} extends DomainEntity<{Entity}Pg> {
  // Define all properties as readonly
  readonly id: string;
  readonly createdAt: Date;  // Include if table has created_at
  readonly updatedAt: Date;  // Include if table has updated_at
  // Add all other table columns in camelCase
  readonly {columnName}: {Type};
  // ... more columns

  constructor(plain: {Entity}Plain) {
    super();
    Object.assign(this, plain);
  }

  // Business logic method for updating the entity
  edit(data: {Entity}UpdateData) {
    const plain: {Entity}Plain = {
      id: this.id,
      createdAt: this.createdAt,  // Keep immutable fields
      updatedAt: new Date(),      // Update timestamp
      
      // updatable fields - use valueOr helper
      {columnName}: valueOr(data.{columnName}, this.{columnName}),
      // ... more updatable fields
    };

    Object.assign(this, plain);
  }

  // Add any custom business methods here
  // Example: getFullName(), calculateTotal(), isExpired(), etc.
}
```

**Real Example (User):**
```typescript
import { UsersStatus } from '@/infra/db/db';
import { DomainEntity } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type { UserPg, UserPlain, UserUpdateData } from './user.type';

export class User extends DomainEntity<UserPg> {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly userStatus: UsersStatus;

  constructor(plain: UserPlain) {
    super();
    Object.assign(this, plain);
  }

  edit(data: UserUpdateData) {
    const plain: UserPlain = {
      id: this.id,
      userStatus: valueOr(data.userStatus, this.userStatus),
      email: valueOr(data.email, this.email),
      firstName: valueOr(data.firstName, this.firstName),
      lastName: valueOr(data.lastName, this.lastName),
    };

    Object.assign(this, plain);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

**Key Points:**
- Extends `DomainEntity<{Entity}Pg>` for state tracking
- All properties are `readonly` for immutability
- `edit()` method handles updates using `valueOr` (keeps current if new is undefined)
- Column names converted from snake_case to camelCase
- Add custom business methods at the end

---

### File 2: `{domain-name}.factory.ts`

**Purpose:** Create new entity instances and mock data for testing

**Pattern:**
```typescript
import { faker } from '@faker-js/faker';

import { uuidV7 } from '@/shared/common/common.crypto';
import { valueOr } from '@/shared/common/common.func';
import { toISO } from '@/shared/common/common.transformer';

import type { {Entity} } from './{domain-name}.domain';
import { {entity}FromPlain } from './{domain-name}.mapper';
import type { {Entity}NewData, {Entity}Plain } from './{domain-name}.type';

// Create a new entity instance
export function new{Entity}(data: {Entity}NewData): {Entity} {
  return {entity}FromPlain({
    id: uuidV7(),
    createdAt: new Date(),  // if has created_at column
    updatedAt: new Date(),  // if has updated_at column
    
    // Required fields from data
    {requiredField}: data.{requiredField},
    
    // Optional fields with defaults
    {optionalField}: valueOr(data.{optionalField}, {defaultValue}),
  });
}

// Bulk create
export function new{Entity}s(data: {Entity}NewData[]) {
  return data.map((d) => new{Entity}(d));
}

// Create mock for testing
export function mock{Entity}(data?: Partial<{Entity}Plain>) {
  return {entity}FromPlain({
    id: valueOr(data?.id, uuidV7()),
    createdAt: valueOr(data?.createdAt, new Date()),
    updatedAt: valueOr(data?.updatedAt, new Date()),
    
    // Use faker for realistic test data
    {field}: valueOr(data?.{field}, faker.{appropriate}.{method}()),
    // Examples:
    // email: valueOr(data?.email, faker.internet.email()),
    // firstName: valueOr(data?.firstName, faker.person.firstName()),
    // title: valueOr(data?.title, faker.lorem.sentence()),
    // amount: valueOr(data?.amount, faker.number.int({ min: 1, max: 100 })),
  });
}

// Bulk mock
export function mock{Entity}s(amount: number, data?: Partial<{Entity}Plain>) {
  return Array(amount)
    .fill(0)
    .map(() => mock{Entity}(data));
}
```

**Faker.js Common Methods:**
- `faker.person.firstName()`, `faker.person.lastName()`, `faker.person.fullName()`
- `faker.internet.email()`, `faker.internet.url()`, `faker.internet.userName()`
- `faker.lorem.sentence()`, `faker.lorem.paragraph()`, `faker.lorem.words()`
- `faker.number.int({ min, max })`, `faker.number.float()`
- `faker.date.past()`, `faker.date.future()`, `faker.date.recent()`
- `faker.string.uuid()`, `faker.string.alphanumeric()`
- `faker.datatype.boolean()`

---

### File 3: `{domain-name}.mapper.ts`

**Purpose:** Transform data between different representations (Pg ↔ Plain ↔ Json ↔ Response)

**Pattern:**
```typescript
import { toDate, toISO } from '@/shared/common/common.transformer';

import { {Entity} } from './{domain-name}.domain';
import type {
  {Entity}Json,
  {Entity}JsonState,
  {Entity}Pg,
  {Entity}Plain,
  {Entity}Response,
} from './{domain-name}.type';

// ========== FROM CONVERSIONS (Creating Entity) ==========

// From database (snake_case → camelCase)
export function {entity}FromPg(data: {Entity}Pg): {Entity} {
  const plain: {Entity}Plain = {
    id: data.id,
    createdAt: toDate(data.created_at),  // Convert ISO string to Date
    updatedAt: toDate(data.updated_at),
    {camelField}: data.{snake_field},
    // ... map all fields
  };

  return new {Entity}(plain);
}

// From database with state tracking (for existing DB records)
export function {entity}FromPgWithState(data: {Entity}Pg): {Entity} {
  return {entity}FromPg(data).setPgState({entity}ToPg);
}

// From plain object (already camelCase)
export function {entity}FromPlain(data: {Entity}Plain): {Entity} {
  const plain: {Entity}Plain = {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    {field}: data.{field},
    // ... all fields
  };

  return new {Entity}(plain);
}

// From JSON (deserialize dates)
export function {entity}FromJson(data: {Entity}Json): {Entity} {
  const plain: {Entity}Plain = {
    id: data.id,
    createdAt: new Date(data.createdAt),  // ISO string → Date
    updatedAt: new Date(data.updatedAt),
    {field}: data.{field},
    // ... all fields
  };

  return new {Entity}(plain);
}

// From JSON with state
export function {entity}FromJsonState(data: {Entity}JsonState): {Entity} {
  const {entity} = {entity}FromJson(data.data);
  {entity}.setPgState(data.state);
  return {entity};
}

// ========== TO CONVERSIONS (Exporting Entity) ==========

// To database format (camelCase → snake_case)
export function {entity}ToPg(data: {Entity}): {Entity}Pg {
  return {
    id: data.id,
    created_at: toISO(data.createdAt),  // Date → ISO string
    updated_at: toISO(data.updatedAt),
    {snake_field}: data.{camelField},
    // ... all fields
  };
}

// To plain object
export function {entity}ToPlain(data: {Entity}): {Entity}Plain {
  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    {field}: data.{field},
    // ... all fields
  };
}

// To API response (customize based on what to expose)
export function {entity}ToResponse(data: {Entity}): {Entity}Response {
  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    {field}: data.{field},
    // Only include fields that should be in API response
  };
}

// Pg directly to Response (optimization, skip entity creation)
export function {entity}PgToResponse(data: {Entity}Pg): {Entity}Response {
  return {
    id: data.id,
    createdAt: toDate(data.created_at),
    updatedAt: toDate(data.updated_at),
    {camelField}: data.{snake_field},
    // ... response fields
  };
}

// To JSON (serialize dates)
export function {entity}ToJson(data: {Entity}): {Entity}Json {
  return {
    id: data.id,
    createdAt: toISO(data.createdAt),  // Date → ISO string
    updatedAt: toISO(data.updatedAt),
    {field}: data.{field},
    // ... all fields
  };
}

// To JSON with state
export function {entity}ToJsonState(data: {Entity}): {Entity}JsonState {
  return {
    state: data.pgState,
    data: {entity}ToJson(data),
  };
}
```

**Key Transformation Helpers:**
- `toDate(isoString)`: Convert ISO string → Date object
- `toISO(date)`: Convert Date object → ISO string
- Always map snake_case ↔ camelCase consistently

---

### File 4: `{domain-name}.module.ts`

**Purpose:** NestJS module definition

**Pattern:**
```typescript
import { Module } from '@nestjs/common';

import { {Entity}Service } from './{domain-name}.service';

@Module({
  providers: [{Entity}Service],
  exports: [{Entity}Service],
})
export class {Entity}Module {}
```

**Always:**
- Import and declare the service
- Export the service for use in other modules

---

### File 5: `{domain-name}.service.ts`

**Purpose:** Database operations, queries, and persistence logic

**Pattern:**
```typescript
import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import {
  addPagination,
  getDbErrorKey,
  queryCount,
  sortQb,
} from '@/infra/db/db.util';
import { diff, getUniqueIds } from '@/shared/common/common.func';
import { isDefined } from '@/shared/common/common.validator';
import { ApiException } from '@/shared/http/http.exception';

import { {Entity} } from './{domain-name}.domain';
import { {entity}FromPgWithState, {entity}ToPg } from './{domain-name}.mapper';
import { {table}TableFilter } from './{domain-name}.util';
import { {Entity}FilterOptions, {Entity}QueryOptions } from './{domain-name}.zod';

@Injectable()
export class {Entity}Service {
  constructor(private db: MainDb) {}

  // ========== QUERY METHODS ==========

  // Find IDs with filtering, sorting, pagination
  async findIds(opts?: {Entity}QueryOptions) {
    opts ??= {};

    const { filter, sort, pagination } = opts;

    const res = await this._getFilterQb(filter)
      .select('{table}.id')
      .$if(!!sort?.length, (q) =>
        sortQb(q, sort, {
          // Map sort keys to actual column paths
          id: '{table}.id',
          createdAt: '{table}.created_at',
          {sortKey}: '{table}.{column}',
          // Add all sortable fields
        }),
      )
      .$call((q) => addPagination(q, pagination))
      .execute();

    return getUniqueIds(res);
  }

  // Get total count with filters
  async getCount(filter?: {Entity}FilterOptions) {
    const totalCount = await this
      ._getFilterQb(filter)
      .$call((q) => queryCount(q));

    return totalCount;
  }

  // Find single entity by ID
  async findOne(id: string) {
    const {entity}Pg = await this.db.read
      .selectFrom('{table}')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!{entity}Pg) {
      return null;
    }

    const {entity} = {entity}FromPgWithState({entity}Pg);
    return {entity};
  }

  // Delete entity from database
  async delete({entity}: {Entity}) {
    await this.db.write
      .deleteFrom('{table}')
      .where('id', '=', {entity}.id)
      .execute();
  }

  // Find by unique field (add as needed)
  async findBy{UniqueField}({field}: {Type}) {
    const {entity}Pg = await this.db.read
      .selectFrom('{table}')
      .selectAll()
      .where('{column}', '=', {field})
      .executeTakeFirst();

    if (!{entity}Pg) {
      return null;
    }

    const {entity} = {entity}FromPgWithState({entity}Pg);
    return {entity};
  }

  // ========== PERSISTENCE METHODS ==========

  // Save single entity (insert or update)
  async save({entity}: {Entity}) {
    this._validate({entity});

    try {
      if (!{entity}.isPersist) {
        await this._create({entity});
      } else {
        await this._update({entity}.id, {entity});
      }
    } catch (e) {
      const errKey = getDbErrorKey(e);
      if (errKey === 'exists') {
        // Customize error based on unique constraint
        throw new ApiException(400, '{field}Exists');
      }
      throw e;
    }

    {entity}.setPgState({entity}ToPg);
  }

  // Save multiple entities
  async saveBulk({entity}s: {Entity}[]) {
    return Promise.all({entity}s.map((e) => this.save(e)));
  }

  // ========== PRIVATE METHODS ==========

  // Validation logic
  private _validate(_{entity}: {Entity}) {
    // Add validation rules here
    // Example:
    // if (!_entity.email.includes('@')) {
    //   throw new ApiException(400, 'invalidEmail');
    // }
  }

  // Create new record
  private async _create({entity}: {Entity}) {
    await this.db.write
      .insertInto('{table}')
      .values({entity}ToPg({entity}))
      .execute();
  }

  // Update existing record (only changed fields)
  private async _update(id: string, {entity}: {Entity}) {
    const data = diff({entity}.pgState, {entity}ToPg({entity}));
    if (!data) {
      return; // No changes
    }

    await this.db.write
      .updateTable('{table}')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  // Build filter query
  private _getFilterQb(filter?: {Entity}FilterOptions) {
    return this.db.read
      .selectFrom('{table}')
      .where({table}TableFilter)
      .$if(isDefined(filter?.{field}), (q) =>
        q.where('{table}.{column}', '=', filter!.{field}!),
      )
      .$if(isDefined(filter?.search), (q) => {
        const search = `%${filter!.search!}%`;
        return q.where((eb) =>
          eb.or([
            eb('{table}.{searchable_column1}', 'ilike', search),
            eb('{table}.{searchable_column2}', 'ilike', search),
            // Add all searchable text columns
          ]),
        );
      });
      // Add more filter conditions based on {Entity}FilterOptions
  }
}
```

**Database Operations:**
- `this.db.read`: Read-only queries
- `this.db.write`: Insert/Update/Delete operations
- Always use `executeTakeFirst()` for single results
- Always use `execute()` for inserts/updates

**Filter Operators:**
- `'='`: Exact match
- `'ilike'`: Case-insensitive partial match (for search)
- `'>'`, `'<'`, `'>='`, `'<='`: Comparisons
- `'in'`: Match any in array
- `'is'`: For null checks

---

### File 6: `{domain-name}.type.ts`

**Purpose:** TypeScript type definitions

**Pattern:**
```typescript
import type { {Table}, {EnumType} } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { Plain, Serialized, WithPgState } from '@/shared/type/type.common';

import type { {Entity} } from './{domain-name}.domain';

// Database model (from Kysely schema)
export type {Entity}Pg = DBModel<{Table}>;

// Plain TypeScript object (camelCase, Date objects)
export type {Entity}Plain = Plain<{Entity}>;

// JSON serialized (camelCase, ISO strings for dates)
export type {Entity}Json = Serialized<{Entity}Plain>;

// JSON with persistence state
export type {Entity}JsonState = WithPgState<{Entity}Json, {Entity}Pg>;

// API response type (customize what to expose)
export type {Entity}Response = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  {field}: {Type};
  // Only include fields for API response
};

// Data required to create new entity
export type {Entity}NewData = {
  {requiredField}: {Type};
  {requiredField2}: {Type};
  {optionalField}?: {Type};
  // Exclude: id, createdAt, updatedAt (auto-generated)
};

// Data for updating existing entity (all optional)
export type {Entity}UpdateData = {
  {field}?: {Type};
  {field2}?: {Type};
  // All updatable fields as optional
  // Exclude: id, createdAt (immutable)
};
```

---

### File 7: `{domain-name}.util.ts`

**Purpose:** Helper functions and constants

**Pattern:**
```typescript
import type { {EnumType} } from '@/infra/db/db';
import { EB } from '@/infra/db/db.common';
import { UnionArray } from '@/shared/type/type.common';

// Export enum values as const arrays (if table has enums)
export const {ENUM_NAME}: UnionArray<{EnumType}> = [
  '{VALUE1}',
  '{VALUE2}',
  '{VALUE3}',
] as const;

// Base filter for all queries (e.g., soft delete, tenant filtering)
export function {table}TableFilter(eb: EB<'{table}'>) {
  // Return empty array if no base filter
  return eb.and([]);
  
  // Example with soft delete:
  // return eb.and([
  //   eb('{table}.deleted_at', 'is', null),
  // ]);
  
  // Example with tenant filtering:
  // return eb.and([
  //   eb('{table}.tenant_id', '=', getCurrentTenantId()),
  // ]);
}
```

**Common Base Filters:**
- Soft delete: `eb('{table}.deleted_at', 'is', null)`
- Active status: `eb('{table}.status', '=', 'ACTIVE')`
- Tenant: `eb('{table}.tenant_id', '=', tenantId)`

---

### File 8: `{domain-name}.zod.ts`

**Purpose:** Zod validation schemas for filtering and sorting

**Pattern:**
```typescript
import z from 'zod';

import type { PaginationQuery } from '@/shared/common/common.pagination';
import { getSortZod } from '@/shared/zod/zod.util';

import { {ENUM_CONSTANT} } from './{domain-name}.util';

// Filter schema - include ALL queryable fields
export const {entity}FilterZod = z
  .object({
    // Exact match filters
    {field}: z.string().optional(),
    {enumField}: z.enum({ENUM_CONSTANT}).optional(),
    {numberField}: z.number().optional(),
    {boolField}: z.boolean().optional(),
    
    // UUID filters
    {idField}: z.string().uuid().optional(),
    {idArrayField}: z.array(z.string().uuid()).optional(),
    
    // Date range filters
    {dateField}From: z.string().datetime().optional(),
    {dateField}To: z.string().datetime().optional(),
    
    // Text search (searches across multiple columns)
    search: z.string().optional(),
    
    // Add as many filter options as make sense for the table
  })
  .optional();

// Sort schema - include ALL sortable fields
export const {entity}SortZod = getSortZod([
  'id',
  'createdAt',
  'updatedAt',
  '{field1}',
  '{field2}',
  // Include all fields users might want to sort by
  // Commonly: dates, names, amounts, statuses
]);

// Query options type (filter + sort + pagination)
export type {Entity}QueryOptions = {
  filter?: z.infer<typeof {entity}FilterZod>;
  sort?: z.infer<typeof {entity}SortZod>;
  pagination?: PaginationQuery;
};

// Shorthand for just filter
export type {Entity}FilterOptions = {Entity}QueryOptions['filter'];
```

**Filter Field Types:**
- `z.string()`: Text fields
- `z.number()` / `z.number().int()`: Numeric fields
- `z.boolean()`: Boolean fields
- `z.string().uuid()`: UUID fields
- `z.string().email()`: Email fields
- `z.string().datetime()`: ISO datetime strings
- `z.enum([...])`: Enum types
- `z.array(z.{type}())`: Array fields
- Add `.optional()` to make all filters optional

**Sort Fields:**
- Include any field users might sort by
- Common: `id`, `createdAt`, `updatedAt`, names, amounts, dates
- Sorting supports `fieldName` (asc) and `-fieldName` (desc)

---

## Many-to-Many Domain

Use this pattern for join tables with composite primary keys.

### Differences from Normal Domain:
1. **No `.zod.ts` file** - Usually no filtering/sorting needed
2. **No `.util.ts` file** - No enums or base filters
3. **No `edit()` method** - Relations are insert/delete only
4. **Simpler service** - Just relationship management methods
5. **Composite keys** - Two foreign key columns as primary key

### File 1: `{domain-name}.domain.ts`

```typescript
import { DomainEntity } from '@/shared/common/common.domain';

import { {Entity}Pg, {Entity}Plain } from './{domain-name}.type';

export class {Entity} extends DomainEntity<{Entity}Pg> {
  readonly createdAt: Date;  // If has timestamp
  readonly {foreignKey1}: string;
  readonly {foreignKey2}: string;

  constructor(plain: {Entity}Plain) {
    super();
    Object.assign(this, plain);
  }
  
  // No edit() method for many-to-many
}
```

### File 2: `{domain-name}.factory.ts`

```typescript
import { uuidV7 } from '@/shared/common/common.crypto';
import { toISO } from '@/shared/common/common.transformer';

import { {Entity} } from './{domain-name}.domain';
import { {entity}FromPlain } from './{domain-name}.mapper';
import {
  {Entity}NewData,
  {Entity}Pg,
  {Entity}Plain,
} from './{domain-name}.type';

// Create Pg object directly (for bulk inserts)
export function new{Entity}Pg(data: {Entity}NewData): {Entity}Pg {
  return {
    created_at: toISO(new Date()),
    {foreign_key_1}: data.{foreignKey1},
    {foreign_key_2}: data.{foreignKey2},
  };
}

// Create domain entity
export function new{Entity}(data: {Entity}NewData): {Entity} {
  const plain: {Entity}Plain = {
    createdAt: new Date(),
    {foreignKey1}: data.{foreignKey1},
    {foreignKey2}: data.{foreignKey2},
  };

  return {entity}FromPlain(plain);
}

// Bulk create
export function new{Entity}s(data: {Entity}NewData[]): {Entity}[] {
  return data.map((item) => new{Entity}(item));
}

// Mock for testing
export function mock{Entity}(data: Partial<{Entity}Plain>): {Entity} {
  const plain: {Entity}Plain = {
    createdAt: new Date(),
    {foreignKey1}: uuidV7(),
    {foreignKey2}: uuidV7(),
    ...data,
  };

  return {entity}FromPlain(plain);
}

// Bulk mock
export function mock{Entity}s(count: number): {Entity}[] {
  return Array.from({ length: count }).map(() => mock{Entity}({}));
}
```

### File 3: `{domain-name}.mapper.ts`

```typescript
import { toDate, toISO } from '@/shared/common/common.transformer';

import { {Entity} } from './{domain-name}.domain';
import {
  {Entity}Json,
  {Entity}JsonState,
  {Entity}Pg,
  {Entity}Plain,
} from './{domain-name}.type';

export function {entity}FromPg(data: {Entity}Pg): {Entity} {
  const plain: {Entity}Plain = {
    createdAt: toDate(data.created_at),
    {foreignKey1}: data.{foreign_key_1},
    {foreignKey2}: data.{foreign_key_2},
  };

  return new {Entity}(plain);
}

export function {entity}FromPgWithState(data: {Entity}Pg): {Entity} {
  return {entity}FromPg(data).setPgState({entity}ToPg);
}

export function {entity}FromPlain(data: {Entity}Plain): {Entity} {
  const plain: {Entity}Plain = {
    createdAt: data.createdAt,
    {foreignKey1}: data.{foreignKey1},
    {foreignKey2}: data.{foreignKey2},
  };

  return new {Entity}(plain);
}

export function {entity}FromJson(data: {Entity}Json): {Entity} {
  const plain: {Entity}Plain = {
    createdAt: new Date(data.createdAt),
    {foreignKey1}: data.{foreignKey1},
    {foreignKey2}: data.{foreignKey2},
  };

  return new {Entity}(plain);
}

export function {entity}ToPg(data: {Entity}): {Entity}Pg {
  return {
    created_at: toISO(data.createdAt),
    {foreign_key_1}: data.{foreignKey1},
    {foreign_key_2}: data.{foreignKey2},
  };
}

export function {entity}ToPlain(data: {Entity}): {Entity}Plain {
  return {
    createdAt: data.createdAt,
    {foreignKey1}: data.{foreignKey1},
    {foreignKey2}: data.{foreignKey2},
  };
}

export function {entity}ToJson(data: {Entity}): {Entity}Json {
  return {
    createdAt: toISO(data.createdAt),
    {foreignKey1}: data.{foreignKey1},
    {foreignKey2}: data.{foreignKey2},
  };
}

export function {entity}ToJsonState(
  data: {Entity},
): {Entity}JsonState {
  return {
    state: data.pgState,
    data: {entity}ToJson(data),
  };
}
```

### File 4: `{domain-name}.module.ts`

Same as normal domain.

### File 5: `{domain-name}.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';

import { new{Entity}Pg } from './{domain-name}.factory';

@Injectable()
export class {Entity}Service {
  constructor(private db: MainDb) {}

  // Save all relations for first entity
  async save{Entity1}Relations({entity1}Id: string, {entity2}Ids: string[]) {
    await this.delete{Entity1}Relations({entity1}Id);

    if (!{entity2}Ids.length) {
      return;
    }

    const insertData = {entity2}Ids.map(({entity2}Id) =>
      new{Entity}Pg({
        {foreignKey1}: {entity1}Id,
        {foreignKey2}: {entity2}Id,
      }),
    );
    
    await this.db.write
      .insertInto('{table}')
      .values(insertData)
      .execute();
  }

  // Save all relations for second entity
  async save{Entity2}Relations({entity2}Id: string, {entity1}Ids: string[]) {
    await this.delete{Entity2}Relations({entity2}Id);

    if (!{entity1}Ids.length) {
      return;
    }

    const insertData = {entity1}Ids.map(({entity1}Id) =>
      new{Entity}Pg({
        {foreignKey1}: {entity1}Id,
        {foreignKey2}: {entity2}Id,
      }),
    );

    await this.db.write
      .insertInto('{table}')
      .values(insertData)
      .execute();
  }

  // Delete all relations for first entity
  async delete{Entity1}Relations({entity1}Id: string) {
    await this.db.write
      .deleteFrom('{table}')
      .where('{table}.{foreign_key_1}', '=', {entity1}Id)
      .execute();
  }

  // Delete all relations for second entity
  async delete{Entity2}Relations({entity2}Id: string) {
    await this.db.write
      .deleteFrom('{table}')
      .where('{table}.{foreign_key_2}', '=', {entity2}Id)
      .execute();
  }
}
```

**Pattern:**
- Provide methods to manage relations from both sides
- Separate delete methods for better reusability
- Save methods call delete first, then insert new relations
- Check if array is empty before inserting

### File 6: `{domain-name}.type.ts`

```typescript
import { {Table} } from '@/infra/db/db';
import { DBModel } from '@/infra/db/db.common';
import { Plain, Serialized, WithPgState } from '@/shared/type/type.common';

import { {Entity} } from './{domain-name}.domain';

export type {Entity}Pg = DBModel<{Table}>;
export type {Entity}Plain = Plain<{Entity}>;

export type {Entity}Json = Serialized<{Entity}Plain>;
export type {Entity}JsonState = WithPgState<{Entity}Json, {Entity}Pg>;

export type {Entity}NewData = {
  {foreignKey1}: string;
  {foreignKey2}: string;
};
```

---

## Post-Creation Steps

### 1. Register Domain Module

**File:** `src/domain/domain.provider.ts`

Add the new module to the `DOMAIN_PROVIDER` array:

```typescript
import { {Entity}Module } from './base/{domain-name}/{domain-name}.module';

export const DOMAIN_PROVIDER = [
  // ... existing modules
  {Entity}Module,  // Add here
  
  // ... other modules
];
```

**Important:** 
- Import statement at top
- Add to array in logical order (grouped by feature/type)
- Maintain alphabetical or feature-based ordering

### 2. Verify Database Schema

Ensure the table exists in the database:
- Check migration files in `src/infra/db/migrations/`
- Verify Kysely types are generated: `src/infra/db/db.ts`
- If types are missing, regenerate: `npm run cmd db:up`

### 3. Testing Checklist

Create tests to verify:
- [ ] Factory creates valid entities
- [ ] Mapper conversions work (Pg ↔ Plain ↔ Json)
- [ ] Service can create new records
- [ ] Service can update existing records
- [ ] Filters work correctly
- [ ] Sorting works correctly
- [ ] Pagination works

---

## Quick Reference: Naming Conventions

### File Names
- Use kebab-case: `user-profile.domain.ts`, `post-mention.service.ts`
- Match pattern: `{domain-name}.{type}.ts`

### Class Names (PascalCase)
- Entity: `User`, `PostMention`, `UserProfile`
- Service: `UserService`, `PostMentionService`
- Module: `UserModule`, `PostMentionModule`

### Function Names (camelCase)
- Factory: `newUser`, `mockUsers`
- Mapper from: `userFromPg`, `userFromPlain`
- Mapper to: `userToPg`, `userToResponse`

### Variable Names (camelCase)
- Domain instance: `user`, `postMention`
- Database row: `userPg`, `postMentionPg`
- Arrays: `users`, `userIds`

### Type Names (PascalCase)
- Types: `UserPg`, `UserPlain`, `UserJson`, `UserResponse`
- Data types: `UserNewData`, `UserUpdateData`
- Options: `UserQueryOptions`, `UserFilterOptions`

### Database Names (snake_case)
- Tables: `users`, `post_mentions`, `user_profiles`
- Columns: `first_name`, `created_at`, `user_id`

### Constants (SCREAMING_SNAKE_CASE)
- Enums: `USER_STATUS`, `FILE_EXPOSE_TYPE`

---

## Common Patterns Summary

### Type Conversions Flow
```
Database (snake_case) ←→ Domain (camelCase) ←→ API Response (camelCase)
     ↓                         ↓                        ↓
   UserPg               User (entity)            UserResponse
```

### Date Handling
- **Database**: ISO string (`"2024-01-15T10:30:00Z"`)
- **Domain**: Date object (`new Date()`)
- **JSON**: ISO string (`"2024-01-15T10:30:00Z"`)
- **Use:** `toDate()` for DB→Domain, `toISO()` for Domain→DB

### Persistence Flow
```
1. Create entity: newUser(data)
2. Validate: service._validate(user)
3. Check state: if (!user.isPersist)
4. Insert/Update: service._create() or service._update()
5. Update state: user.setPgState(userToPg)
```

### Query Flow
```
1. Build base query: this.db.read.selectFrom('table')
2. Apply base filter: .where(tableFilter)
3. Apply user filters: .$if(isDefined(filter?.field), ...)
4. Apply sorting: .$if(!!sort?.length, sortQb(...))
5. Apply pagination: .$call(addPagination)
6. Execute: .execute()
7. Map results: results.map(row => entityFromPgWithState(row))
```

---

## Helpful Tips

1. **Start with the type file** - Define all types first, then implement other files
2. **Copy from examples** - Use existing domains as templates
3. **Keep mapper comprehensive** - Always implement all conversion functions
4. **Think about API needs** - What filters/sorts will API consumers need?
5. **Add business logic to domain** - Put calculations, validations in the entity class
6. **Use meaningful method names** - `getFullName()` is better than `getName()`
7. **Document complex logic** - Add comments for non-obvious business rules
8. **Test incrementally** - Test each file as you create it

---

## Example: Full Domain Creation Workflow

**Given table:** `products` with columns: `id`, `name`, `price`, `stock`, `category`, `created_at`, `updated_at`

**Steps:**
1. Create folder: `src/domain/base/product/`
2. Create `product.type.ts` - Define all types
3. Create `product.domain.ts` - Entity class with `edit()` method
4. Create `product.mapper.ts` - All conversion functions
5. Create `product.factory.ts` - `newProduct`, `mockProduct`
6. Create `product.util.ts` - `PRODUCT_CATEGORIES`, `productsTableFilter`
7. Create `product.zod.ts` - Filters and sorts
8. Create `product.service.ts` - CRUD operations
9. Create `product.module.ts` - NestJS module
10. Register in `domain.provider.ts`
11. Test all operations

---

**End of Documentation**