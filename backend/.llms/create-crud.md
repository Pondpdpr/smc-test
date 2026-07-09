# Complete CRUD API Pattern Guide

This guide documents the complete pattern for creating CRUD APIs with comprehensive tests. This pattern is used throughout the application and should be followed for consistency. Only these file can be reference, do not reference any other file since some is incomplete.
- create-crud.md (this file)
- schema.dbml (table name will be snake_case of entities name)
- src/domain/base/{entity}/**

## Table of Contents
1. [Directory Structure](#directory-structure)
2. [File-by-File Breakdown](#file-by-file-breakdown)
3. [Response Structure](#response-structure)
4. [Testing Pattern](#testing-pattern)
5. [Bruno API Specification](#bruno-api-specification)
6. [Step-by-Step Implementation](#step-by-step-implementation)

---

## Directory Structure

For an entity `{Entity}`, create this structure:

```
src/app/api/v1/{entities}/
├── {entities}.v1.controller.ts          # Main controller
├── {entities}.v1.module.ts              # NestJS module
├── {entities}.v1.util.ts                # Utility functions (includes, QB helpers)
├── create-{entity}/
│   ├── create-{entity}.command.ts       # Create command logic
│   ├── create-{entity}.dto.ts           # DTO and response types
│   └── create-{entity}.spec.ts          # E2E tests
├── list-{entities}/
│   ├── list-{entities}.query.ts         # List query logic
│   ├── list-{entities}.dto.ts           # DTO and response types
│   └── list-{entities}.spec.ts          # E2E tests
├── get-{entity}/
│   ├── get-{entity}.query.ts            # Get query logic
│   ├── get-{entity}.dto.ts              # DTO and response types
│   └── get-{entity}.spec.ts             # E2E tests
├── update-{entity}/
│   ├── update-{entity}.command.ts       # Update command logic
│   ├── update-{entity}.dto.ts           # DTO and response types
│   └── update-{entity}.spec.ts          # E2E tests
└── delete-{entity}/
    ├── delete-{entity}.query.ts         # Delete command logic
    ├── delete-{entity}.dto.ts           # Response type only
    └── delete-{entity}.spec.ts          # E2E tests
```

**Naming Convention:**
- Mutations (Create/Update/Delete): Use `.command.ts`
- Queries (List/Get): Use `.query.ts`
- All use `.dto.ts` for DTOs and response types
- All use `.spec.ts` for tests

---

## File-by-File Breakdown

### 1. Controller (`{entities}.v1.controller.ts`)

**Purpose:** Define all HTTP endpoints for the entity

**Template:**
```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateEntityCommand } from './create-entity/create-entity.command';
import { CreateEntityDto, CreateEntityResponse } from './create-entity/create-entity.dto';
import { DeleteEntityResponse } from './delete-entity/delete-entity.dto';
import { DeleteEntityCommand } from './delete-entity/delete-entity.query';
import { GetEntityDto, GetEntityResponse } from './get-entity/get-entity.dto';
import { GetEntityQuery } from './get-entity/get-entity.query';
import { ListEntitiesDto, ListEntitiesResponse } from './list-entities/list-entities.dto';
import { ListEntitiesQuery } from './list-entities/list-entities.query';
import { UpdateEntityCommand } from './update-entity/update-entity.command';
import { UpdateEntityDto, UpdateEntityResponse } from './update-entity/update-entity.dto';

@Controller({
  path: 'entities',
  version: '1',
})
export class EntitiesV1Controller {
  constructor(
    private listEntitiesQuery: ListEntitiesQuery,
    private getEntityQuery: GetEntityQuery,
    private updateEntityCommand: UpdateEntityCommand,
    private createEntityCommand: CreateEntityCommand,
    private deleteEntityCommand: DeleteEntityCommand,
  ) {}

  @Get()
  async listEntities(@Query() query: ListEntitiesDto): Promise<ListEntitiesResponse> {
    return this.listEntitiesQuery.exec(query);
  }

  @Post()
  async createEntity(@Body() body: CreateEntityDto): Promise<CreateEntityResponse> {
    return this.createEntityCommand.exec(body);
  }

  @Get(':id')
  async getEntity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetEntityDto,
  ): Promise<GetEntityResponse> {
    return this.getEntityQuery.exec(id, query);
  }

  @Patch(':id')
  async updateEntity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEntityDto,
  ): Promise<UpdateEntityResponse> {
    return this.updateEntityCommand.exec(id, body);
  }

  @Delete(':id')
  async deleteEntity(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteEntityResponse> {
    return this.deleteEntityCommand.exec(id);
  }
}
```

**Key Points:**
- Use `ParseUUIDPipe` for `:id` parameters to validate UUID format
- Use `@Query()` for GET query parameters
- Use `@Body()` for POST/PATCH request bodies
- Version the API with `version: '1'`

---

### 2. Module (`{entities}.v1.module.ts`)

**Purpose:** Register all providers and controllers

**Template:**
```typescript
import { Module } from '@nestjs/common';

import { CreateEntityCommand } from './create-entity/create-entity.command';
import { DeleteEntityCommand } from './delete-entity/delete-entity.query';
import { GetEntityQuery } from './get-entity/get-entity.query';
import { ListEntitiesQuery } from './list-entities/list-entities.query';
import { UpdateEntityCommand } from './update-entity/update-entity.command';
import { EntitiesV1Controller } from './entities.v1.controller';

@Module({
  providers: [
    ListEntitiesQuery,
    CreateEntityCommand,
    GetEntityQuery,
    UpdateEntityCommand,
    DeleteEntityCommand,
  ],
  controllers: [EntitiesV1Controller],
})
export class EntitiesV1Module {}
```

---

### 3. Utilities (`{entities}.v1.util.ts`)

**Purpose:** Define includes for relations and query builders

**Template:**
```typescript
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import z from 'zod';

import { relatedTableFilter } from '@/domain/base/related/related.util';
import { SelectQB } from '@/infra/db/db.common';
import { getIncludesZod } from '@/shared/zod/zod.util';

// Define what can be included in responses
export const entitiesV1IncludesZod = getIncludesZod(['relation1', 'relation1.nestedRelation']);

// Query builder for including relations
export function entitiesV1InclusionQb(
  qb: SelectQB<'entities'>,
  includes: z.infer<typeof entitiesV1IncludesZod>,
) {
  return qb.$if(includes.has('relation1'), (q) =>
    q.select((eb) =>
      jsonArrayFrom(
        eb
          .selectFrom('relation1_table')
          .where(relatedTableFilter)
          .whereRef('relation1_table.entity_id', '=', 'entities.id')
          .$if(includes.has('relation1.nestedRelation'), (q) =>
            q.select((eb) =>
              jsonArrayFrom(
                eb
                  .selectFrom('nested_table')
                  .selectAll('nested_table')
                  .where(nestedTableFilter)
                  .whereRef('nested_table.relation1_id', '=', 'relation1_table.id'),
              ).as('nestedRelation'),
            ),
          )
          .selectAll('relation1_table'),
      ).as('relation1'),
    ),
  );
}
```

**Key Points:**
- Use `getIncludesZod()` to define available includes
- Support nested includes with dot notation: `'posts.comments'` try to include as many relations as possible, can be more than 1 level deep if necessary
- Use `jsonArrayFrom` or `jsonObjectFrom` for JSON aggregation depending on manytomany join or one to many join, can lookup schema.dbml for reference of relations for the table.
- Use `$if` for conditional query building
- Always use table filters for soft deletes

---

### 4. Create Command (`create-{entity}/create-{entity}.command.ts`)

**Purpose:** Handle entity creation

**Template:**
```typescript
import { Injectable } from '@nestjs/common';

import { Entity } from '@/domain/base/entity/entity.domain';
import { newEntity } from '@/domain/base/entity/entity.factory';
import { entityToResponse } from '@/domain/base/entity/entity.mapper';
import { EntityService } from '@/domain/base/entity/entity.service';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { CreateEntityDto, CreateEntityResponse } from './create-entity.dto';

@Injectable()
export class CreateEntityCommand implements CommandInterface {
  constructor(private entityService: EntityService) {}

  async exec(body: CreateEntityDto): Promise<CreateEntityResponse> {
    const entity = newEntity(body);

    await this.save(entity);

    return toHttpSuccess({
      data: { entity: { attributes: entityToResponse(entity) } },
    });
  }

  async save(entity: Entity) {
    await this.entityService.save(entity);
  }
}
```

**Key Points:**
- Use factory function `newEntity()` to create the domain object
- Separate `save()` method for easier testing
- Return response with `attributes` wrapper
- Use `toHttpSuccess()` for consistent response format

---

### 5. Create DTO (`create-{entity}/create-{entity}.dto.ts`)

**Purpose:** Define input validation and response type

**Template:**
```typescript
import z from 'zod';

import { EntityResponse } from '@/domain/base/entity/entity.type';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  requiredField: z.string(),
  optionalField: z.string().optional(),
  enumField: z.enum(['VALUE1', 'VALUE2']).optional(),
});

export class CreateEntityDto extends zodDto(zod) {}

// ======= Response =======

export type CreateEntityResponse = IStandardResponse<{
  entity: IResponse<EntityResponse>;
}>;
```

**Key Points:**
- Use Zod for validation
- Extend from `zodDto(zod)` for automatic validation
- Required fields don't have `.optional()`
- Response type uses `IResponse<EntityResponse>`

---

### 6. List Query (`list-{entities}/list-{entities}.query.ts`)

**Purpose:** Handle listing with pagination, filtering, sorting, and includes

**Template:**
```typescript
import { Injectable } from '@nestjs/common';

import { relatedPgToResponse } from '@/domain/base/related/related.mapper';
import { entityPgToResponse } from '@/domain/base/entity/entity.mapper';
import { EntityService } from '@/domain/base/entity/entity.service';
import { MainDb } from '@/infra/db/db.main';
import { filterQbIds } from '@/infra/db/db.util';
import { orUndefined } from '@/shared/common/common.func';
import { getPagination } from '@/shared/common/common.pagination';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { entitiesV1InclusionQb } from '../entities.v1.util';
import { ListEntitiesDto, ListEntitiesResponse } from './list-entities.dto';

@Injectable()
export class ListEntitiesQuery implements QueryInterface {
  constructor(
    private db: MainDb,
    private entityService: EntityService,
  ) {}

  async exec(query: ListEntitiesDto): Promise<ListEntitiesResponse> {
    const raw = await this.getRaw(query);

    const data: ListEntitiesResponse['data'] = {
      entities: raw.result.map((data) => ({
        attributes: entityPgToResponse(data),
        relations: {
          relation1: orUndefined(data.relation1, (items) =>
            items.map((item) => ({
              attributes: relatedPgToResponse(item),
              relations: {
                nestedRelation: orUndefined(item.nestedRelation, (nested) =>
                  nested.map((n) => ({
                    attributes: nestedPgToResponse(n),
                  })),
                ),
              },
            })),
          ),
        },
      })),
    };

    return toHttpSuccess({
      data,
      meta: {
        pagination: getPagination(data.entities, raw.totalCount, query.pagination),
      },
    });
  }

  async getRaw(query: ListEntitiesDto) {
    const ids = await this.entityService.findIds({
      filter: query.filter,
      pagination: query.pagination,
      sort: query.sort,
    });

    if (!ids) {
      return {
        result: [],
        totalCount: 0,
      };
    }

    const result = await this.db.read
      .selectFrom('entities')
      .$call((q) => entitiesV1InclusionQb(q, query.includes))
      .selectAll()
      .$call((q) => filterQbIds(ids, q, 'entities.id'))
      .execute();

    const totalCount = await this.entityService.getCount(query.filter);

    return { result, totalCount };
  }
}
```

**Key Points:**
- Use service's `findIds()` for filtering/sorting/pagination
- Apply includes using utility QB function
- Filter by IDs using `filterQbIds()`
- Get total count separately for pagination
- Use `orUndefined()` to handle optional relations
- Map to response structure with `attributes` and `relations`

---

### 7. List DTO (`list-{entities}/list-{entities}.dto.ts`)

**Purpose:** Define query parameters and response type with relations

**Template:**
```typescript
import z from 'zod';

import { RelatedResponse } from '@/domain/base/related/related.type';
import { EntityResponse } from '@/domain/base/entity/entity.type';
import { entityFilterZod, entitySortZod } from '@/domain/base/entity/entity.zod';
import {
  IPagination,
  IResponse,
  IResponseRelations,
  IStandardResponseWithMeta,
} from '@/shared/type/type.http';
import { paginationZod, zodDto } from '@/shared/zod/zod.util';

import { entitiesV1IncludesZod } from '../entities.v1.util';

const zod = z.object({
  includes: entitiesV1IncludesZod,
  sort: entitySortZod,
  pagination: paginationZod,
  filter: entityFilterZod,
  countFilter: entityFilterZod,
});

export type ListEntitiesQueryInput = z.input<typeof zod>;
export class ListEntitiesDto extends zodDto(zod) {}

// Response

export type ListEntitiesResponse = IStandardResponseWithMeta<
  {
    entities: IResponseRelations<
      EntityResponse,
      {
        relation1?: IResponseRelations<
          RelatedResponse,
          {
            nestedRelation?: IResponse<NestedResponse>[];
          }
        >[];
      }
    >[];
  },
  {
    pagination: IPagination;
  }
>;
```

**Key Points:**
- Use `IStandardResponseWithMeta` for responses with pagination
- Use `IResponseRelations` for entities with relations
- Use `IResponse` for simple nested entities
- Define `QueryInput` type from `z.input<typeof zod>`
- Relations are optional (use `?`)

---

### 8. Get Query (`get-{entity}/get-{entity}.query.ts`)

**Purpose:** Get a single entity by ID with optional includes

**Template:**
```typescript
import { Injectable } from '@nestjs/common';

import { relatedPgToResponse } from '@/domain/base/related/related.mapper';
import { entityPgToResponse } from '@/domain/base/entity/entity.mapper';
import { MainDb } from '@/infra/db/db.main';
import { orUndefined } from '@/shared/common/common.func';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { entitiesV1InclusionQb } from '../entities.v1.util';
import { GetEntityDto, GetEntityResponse } from './get-entity.dto';

@Injectable()
export class GetEntityQuery implements QueryInterface {
  constructor(private db: MainDb) {}

  async exec(id: string, query: GetEntityDto): Promise<GetEntityResponse> {
    const raw = await this.getRaw(id, query);

    const data: GetEntityResponse['data'] = {
      entity: {
        attributes: entityPgToResponse(raw),
        relations: {
          relation1: orUndefined(raw.relation1, (items) =>
            items.map((item) => ({
              attributes: relatedPgToResponse(item),
              relations: {
                nestedRelation: orUndefined(item.nestedRelation, (nested) =>
                  nested.map((n) => ({
                    attributes: nestedPgToResponse(n),
                  })),
                ),
              },
            })),
          ),
        },
      },
    };

    return toHttpSuccess({
      data,
    });
  }

  async getRaw(id: string, query: GetEntityDto) {
    const result = await this.db.read
      .selectFrom('entities')
      .$call((q) => entitiesV1InclusionQb(q, query.includes))
      .selectAll()
      .where('entities.id', '=', id)
      .executeTakeFirst();

    if (!result) {
      throw new ApiException(404, 'entityNotFound');
    }

    return result;
  }
}
```

**Key Points:**
- Throw `ApiException(404)` when entity not found
- Use `executeTakeFirst()` for single result
- Apply includes same as list query
- Same response structure as list but singular

---

### 9. Get DTO (`get-{entity}/get-{entity}.dto.ts`)

**Purpose:** Define includes parameter for get endpoint

**Template:**
```typescript
import z from 'zod';

import { RelatedResponse } from '@/domain/base/related/related.type';
import { EntityResponse } from '@/domain/base/entity/entity.type';
import {
  IResponse,
  IResponseRelations,
  IStandardResponse,
} from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

import { entitiesV1IncludesZod } from '../entities.v1.util';

const zod = z.object({
  includes: entitiesV1IncludesZod,
});

export type GetEntityQueryInput = z.input<typeof zod>;
export class GetEntityDto extends zodDto(zod) {}

// Response

export type GetEntityResponse = IStandardResponse<{
  entity: IResponseRelations<
    EntityResponse,
    {
      relation1?: IResponseRelations<
        RelatedResponse,
        {
          nestedRelation?: IResponse<NestedResponse>[];
        }
      >[];
    }
  >;
}>;
```

---

### 10. Update Command (`update-{entity}/update-{entity}.command.ts`)

**Purpose:** Handle entity updates

**Template:**
```typescript
import { Injectable } from '@nestjs/common';

import { Entity } from '@/domain/base/entity/entity.domain';
import { entityToResponse } from '@/domain/base/entity/entity.mapper';
import { EntityService } from '@/domain/base/entity/entity.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { UpdateEntityDto, UpdateEntityResponse } from './update-entity.dto';

@Injectable()
export class UpdateEntityCommand implements CommandInterface {
  constructor(private entityService: EntityService) {}

  async exec(id: string, body: UpdateEntityDto): Promise<UpdateEntityResponse> {
    const entity = await this.find(id);
    entity.edit(body);

    await this.save(entity);

    return toHttpSuccess({
      data: { entity: { attributes: entityToResponse(entity) } },
    });
  }

  async find(id: string): Promise<Entity> {
    const entity = await this.entityService.findOne(id);

    if (!entity) {
      throw new ApiException(404, 'notFound');
    }

    return entity;
  }

  async save(entity: Entity) {
    await this.entityService.save(entity);
  }
}
```

**Key Points:**
- Find entity first
- Throw 404 if not found
- Use domain's `edit()` method to apply changes
- Separate methods for testability

---

### 11. Update DTO (`update-{entity}/update-{entity}.dto.ts`)

**Purpose:** Define updatable fields

**Template:**
```typescript
import z from 'zod';

import { EntityResponse } from '@/domain/base/entity/entity.type';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';
import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  field1: z.string().optional(),
  field2: z.string().optional(),
  enumField: z.enum(['VALUE1', 'VALUE2']).optional(),
});

export class UpdateEntityDto extends zodDto(zod) {}

// ======= Response =======

export type UpdateEntityResponse = IStandardResponse<{
  entity: IResponse<EntityResponse>;
}>;
```

**Key Points:**
- All fields are optional
- Same response structure as create

---

### 12. Delete Command (`delete-{entity}/delete-{entity}.query.ts`)

**Purpose:** Handle entity deletion

**Template:**
```typescript
import { Injectable } from '@nestjs/common';

import { Entity } from '@/domain/base/entity/entity.domain';
import { entityToResponse } from '@/domain/base/entity/entity.mapper';
import { EntityService } from '@/domain/base/entity/entity.service';
import { ApiException } from '@/shared/http/http.exception';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { CommandInterface } from '@/shared/type/type.common';

import { DeleteEntityResponse } from './delete-entity.dto';

@Injectable()
export class DeleteEntityCommand implements CommandInterface {
  constructor(private entityService: EntityService) {}

  async exec(id: string): Promise<DeleteEntityResponse> {
    const entity = await this.find(id);

    await this.save(entity);

    return toHttpSuccess({
      data: {
        entity: {
          attributes: entityToResponse(entity),
        },
      },
    });
  }

  async save(entity: Entity) {
    await this.entityService.delete(entity);
  }

  async find(id: string) {
    const entity = await this.entityService.findOne(id);
    if (!entity) {
      throw new ApiException(404, 'entityNotFound');
    }

    return entity;
  }
}
```

**Key Points:**
- Find entity before deleting
- Return the deleted entity data
- Throw 404 if not found

---

### 13. Delete DTO (`delete-{entity}/delete-{entity}.dto.ts`)

**Purpose:** Define response type only (no input)

**Template:**
```typescript
import { EntityResponse } from '@/domain/base/entity/entity.type';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';

// Response

export type DeleteEntityResponse = IStandardResponse<{
  entity: IResponse<EntityResponse>;
}>;
```

---

## Response Structure

### Standard Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  data: {
    // Single entity
    entity: {
      attributes: {
        id: string;
        field1: string;
        // ... entity fields
      }
    }
    
    // Or multiple entities
    entities: [{
      attributes: {
        id: string;
        field1: string;
      },
      relations: {
        relationName?: [{
          attributes: { /* relation fields */ },
          relations: {
            nestedRelation?: [{ attributes: { /* nested fields */ } }]
          }
        }]
      }
    }]
  },
  meta?: {
    pagination: {
      page: number;
      perPage: number;
      totalPages: number;
      totalCount: number;
    }
  }
}
```

**Key Principles:**
1. **attributes**: Always contains the entity's own fields
2. **relations**: Optional, contains related entities
3. **Nesting**: Relations can have their own `relations` object
4. **ID placement**: ID is always in `attributes`, not at the root level
5. **Consistency**: Same structure for single and array responses

---

## Testing Pattern

### Test File Structure

Every CRUD operation must have comprehensive E2E tests following this pattern:

### 1. Create Tests (`create-{entity}.spec.ts`)

**Template:**
```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  createBackendTestingModule,
  getBaseTestHeader,
  startE2e,
  stopE2e,
  testTransactionRollback,
  testTransactionStart,
} from '@/infra/test/test-util/test-util.common';

import { EntitiesV1Module } from '../entities.v1.module';
import { CreateEntityResponse } from './create-entity.dto';

describe('POST /v1/entities', () => {
  let app: INestApplication;
  let headers: Record<string, string>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(EntitiesV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should create entity with valid data', async () => {
    const newEntity = {
      field1: 'Test Value',
      field2: 'Another Value',
    };

    const { status, body } = await request(app.getHttpServer())
      .post('/v1/entities')
      .set(headers)
      .send(newEntity);

    const { success, data } = body as CreateEntityResponse;

    expect(status).toBe(201);
    expect(success).toBe(true);
    expect(data.entity).toBeDefined();
    expect(data.entity.attributes.field1).toBe('Test Value');
    expect(data.entity.attributes.field2).toBe('Another Value');
    expect(data.entity.attributes.id).toBeDefined();
  });

  it('should create entity with optional fields', async () => {
    const newEntity = {
      field1: 'Required Value',
      field2: 'Another Value',
      optionalField: 'OPTIONAL_VALUE',
    };

    const { status, body } = await request(app.getHttpServer())
      .post('/v1/entities')
      .set(headers)
      .send(newEntity);

    const { success, data } = body as CreateEntityResponse;

    expect(status).toBe(201);
    expect(success).toBe(true);
    expect(data.entity.attributes.optionalField).toBe('OPTIONAL_VALUE');
  });

  it('should fail when required field is missing', async () => {
    const newEntity = {
      field2: 'Value',
    };

    const { status, body } = await request(app.getHttpServer())
      .post('/v1/entities')
      .set(headers)
      .send(newEntity);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('should fail with invalid enum value', async () => {
    const newEntity = {
      field1: 'Value',
      field2: 'Value',
      enumField: 'INVALID_VALUE',
    };

    const { status, body } = await request(app.getHttpServer())
      .post('/v1/entities')
      .set(headers)
      .send(newEntity);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});
```

**Test Coverage:**
- ✅ Create with valid data
- ✅ Create with optional fields
- ✅ Missing required fields (400)
- ✅ Invalid enum values (400)
- ✅ Validate response structure

---

### 2. List Tests (`list-{entities}.spec.ts`)

**Template:**
```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { mockEntity } from '@/domain/base/entity/entity.factory';
import { EntityService } from '@/domain/base/entity/entity.service';
import { mockRelated } from '@/domain/base/related/related.factory';
import { RelatedService } from '@/domain/base/related/related.service';
import {
  createBackendTestingModule,
  getBaseTestHeader,
  startE2e,
  stopE2e,
  testTransactionRollback,
  testTransactionStart,
} from '@/infra/test/test-util/test-util.common';

import { EntitiesV1Module } from '../entities.v1.module';
import { ListEntitiesQueryInput, ListEntitiesResponse } from './list-entities.dto';

async function setup(app: INestApplication) {
  const entityService = app.get(EntityService);
  const relatedService = app.get(RelatedService);

  // Create entities with CONSTANT test data
  const entity1 = mockEntity({
    field1: 'Alice',
    field2: 'Anderson',
    status: 'ACTIVE',
  });
  const entity2 = mockEntity({
    field1: 'Bob',
    field2: 'Brown',
    status: 'ACTIVE',
  });
  const entity3 = mockEntity({
    field1: 'Charlie',
    field2: 'Chen',
    status: 'ACTIVE',
  });

  const entities = [entity1, entity2, entity3];

  // Create related data for entity1
  const related1 = mockRelated({
    entityId: entity1.id,
    name: 'First Related',
  });
  const related2 = mockRelated({
    entityId: entity1.id,
    name: 'Second Related',
  });

  await entityService.saveBulk(entities);
  await relatedService.saveBulk([related1, related2]);

  return { entities, related: [related1, related2] };
}

describe('GET /v1/entities', () => {
  let app: INestApplication;
  let headers: Record<string, string>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(EntitiesV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);

    await setup(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should list all entities', async () => {
    const query: ListEntitiesQueryInput = {};

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities')
      .set(headers)
      .query(query);

    const { success, data } = body as ListEntitiesResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entities.length).toBe(3);

    // Verify constant data
    const alice = data.entities.find((e) => e.attributes.field1 === 'Alice');
    expect(alice?.attributes.field2).toBe('Anderson');
    expect(alice?.attributes.status).toBe('ACTIVE');
  });

  it('should support pagination', async () => {
    const query: ListEntitiesQueryInput = {
      pagination: {
        page: '1',
        perPage: '2',
      },
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities')
      .set(headers)
      .query(query);

    const { success, data, meta } = body as ListEntitiesResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entities.length).toBe(2);
    expect(meta.pagination.page).toBe(1);
    expect(meta.pagination.perPage).toBe(2);
  });

  it('should support sorting', async () => {
    const query: ListEntitiesQueryInput = {
      sort: 'field1',
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities')
      .set(headers)
      .query(query);

    const { success, data } = body as ListEntitiesResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    
    // Verify sorted order
    expect(data.entities[0].attributes.field1).toBe('Alice');
    expect(data.entities[1].attributes.field1).toBe('Bob');
    expect(data.entities[2].attributes.field1).toBe('Charlie');
  });

  it('should support filtering', async () => {
    const query: ListEntitiesQueryInput = {
      filter: {
        status: 'ACTIVE',
      },
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities')
      .set(headers)
      .query(query);

    const { success, data } = body as ListEntitiesResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    
    // All should be ACTIVE
    data.entities.forEach((entity) => {
      expect(entity.attributes.status).toBe('ACTIVE');
    });
  });

  it('should return empty array when no match', async () => {
    const query: ListEntitiesQueryInput = {
      filter: {
        status: 'INACTIVE',
      },
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities')
      .set(headers)
      .query(query);

    const { success, data } = body as ListEntitiesResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entities.length).toBe(0);
  });

  it('should include relations when requested', async () => {
    const query: ListEntitiesQueryInput = {
      includes: 'related',
    };

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities')
      .set(headers)
      .query(query);

    const { success, data } = body as ListEntitiesResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);

    const alice = data.entities.find((e) => e.attributes.field1 === 'Alice');
    
    expect(alice?.relations?.related).toBeDefined();
    expect(alice?.relations?.related?.length).toBe(2);
    
    const names = alice?.relations?.related?.map((r) => r.attributes.name).sort();
    expect(names).toEqual(['First Related', 'Second Related']);
  });
});
```

**Test Coverage:**
- ✅ List all entities
- ✅ Pagination
- ✅ Sorting
- ✅ Filtering
- ✅ Empty results
- ✅ Include relations
- ✅ Validate constant data

---

### 3. Get Tests (`get-{entity}.spec.ts`)

**Template:**
```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { mockEntity } from '@/domain/base/entity/entity.factory';
import { EntityService } from '@/domain/base/entity/entity.service';
import { mockRelated } from '@/domain/base/related/related.factory';
import { RelatedService } from '@/domain/base/related/related.service';
import {
  createBackendTestingModule,
  getBaseTestHeader,
  startE2e,
  stopE2e,
  testTransactionRollback,
  testTransactionStart,
} from '@/infra/test/test-util/test-util.common';

import { EntitiesV1Module } from '../entities.v1.module';
import { GetEntityQueryInput, GetEntityResponse } from './get-entity.dto';

async function setup(app: INestApplication) {
  const entityService = app.get(EntityService);
  const relatedService = app.get(RelatedService);

  const entity = mockEntity({
    field1: 'Test Entity',
    field2: 'Test Value',
    status: 'ACTIVE',
  });

  const related1 = mockRelated({
    entityId: entity.id,
    name: 'First Related',
  });
  const related2 = mockRelated({
    entityId: entity.id,
    name: 'Second Related',
  });

  await entityService.save(entity);
  await relatedService.saveBulk([related1, related2]);

  return { entity, related: [related1, related2] };
}

describe('GET /v1/entities/:id', () => {
  let app: INestApplication;
  let headers: Record<string, string>;
  let testData: Awaited<ReturnType<typeof setup>>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(EntitiesV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);

    testData = await setup(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should get entity by id', async () => {
    const query: GetEntityQueryInput = {};

    const { status, body } = await request(app.getHttpServer())
      .get(`/v1/entities/${testData.entity.id}`)
      .set(headers)
      .query(query);

    const { success, data } = body as GetEntityResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entity.attributes.id).toBe(testData.entity.id);
    expect(data.entity.attributes.field1).toBe('Test Entity');
    expect(data.entity.attributes.field2).toBe('Test Value');
    expect(data.entity.attributes.status).toBe('ACTIVE');
  });

  it('should include relations when requested', async () => {
    const query: GetEntityQueryInput = {
      includes: 'related',
    };

    const { status, body } = await request(app.getHttpServer())
      .get(`/v1/entities/${testData.entity.id}`)
      .set(headers)
      .query(query);

    const { success, data } = body as GetEntityResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entity.relations?.related).toBeDefined();
    expect(data.entity.relations?.related?.length).toBe(2);

    const names = data.entity.relations?.related?.map((r) => r.attributes.name).sort();
    expect(names).toEqual(['First Related', 'Second Related']);
  });

  it('should return 404 for non-existent entity', async () => {
    const query: GetEntityQueryInput = {};
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const { status, body } = await request(app.getHttpServer())
      .get(`/v1/entities/${fakeId}`)
      .set(headers)
      .query(query);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid UUID', async () => {
    const query: GetEntityQueryInput = {};

    const { status, body } = await request(app.getHttpServer())
      .get('/v1/entities/not-a-valid-uuid')
      .set(headers)
      .query(query);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});
```

**Test Coverage:**
- ✅ Get by ID
- ✅ Include relations
- ✅ 404 for non-existent
- ✅ 400 for invalid UUID
- ✅ Validate constant data

---

### 4. Update Tests (`update-{entity}.spec.ts`)

**Template:**
```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { mockEntity } from '@/domain/base/entity/entity.factory';
import { EntityService } from '@/domain/base/entity/entity.service';
import {
  createBackendTestingModule,
  getBaseTestHeader,
  startE2e,
  stopE2e,
  testTransactionRollback,
  testTransactionStart,
} from '@/infra/test/test-util/test-util.common';

import { EntitiesV1Module } from '../entities.v1.module';
import { UpdateEntityResponse } from './update-entity.dto';

async function setup(app: INestApplication) {
  const entityService = app.get(EntityService);

  const entity = mockEntity({
    field1: 'Original Value',
    field2: 'Original Field2',
    status: 'ACTIVE',
  });

  await entityService.save(entity);

  return { entity };
}

describe('PATCH /v1/entities/:id', () => {
  let app: INestApplication;
  let headers: Record<string, string>;
  let testData: Awaited<ReturnType<typeof setup>>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(EntitiesV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);

    testData = await setup(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should update single field', async () => {
    const updateData = {
      field1: 'Updated Value',
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/entities/${testData.entity.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateEntityResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entity.attributes.id).toBe(testData.entity.id);
    expect(data.entity.attributes.field1).toBe('Updated Value');
    expect(data.entity.attributes.field2).toBe('Original Field2');
  });

  it('should update multiple fields', async () => {
    const updateData = {
      field1: 'New Value 1',
      field2: 'New Value 2',
      status: 'INACTIVE' as const,
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/entities/${testData.entity.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateEntityResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entity.attributes.field1).toBe('New Value 1');
    expect(data.entity.attributes.field2).toBe('New Value 2');
    expect(data.entity.attributes.status).toBe('INACTIVE');
  });

  it('should succeed with empty update', async () => {
    const updateData = {};

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/entities/${testData.entity.id}`)
      .set(headers)
      .send(updateData);

    const { success, data } = body as UpdateEntityResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entity.attributes.id).toBe(testData.entity.id);
  });

  it('should return 404 for non-existent entity', async () => {
    const updateData = { field1: 'Test' };
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/entities/${fakeId}`)
      .set(headers)
      .send(updateData);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid UUID', async () => {
    const updateData = { field1: 'Test' };

    const { status, body } = await request(app.getHttpServer())
      .patch('/v1/entities/not-a-valid-uuid')
      .set(headers)
      .send(updateData);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('should fail with invalid enum', async () => {
    const updateData = {
      status: 'INVALID_STATUS',
    };

    const { status, body } = await request(app.getHttpServer())
      .patch(`/v1/entities/${testData.entity.id}`)
      .set(headers)
      .send(updateData);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});
```

**Test Coverage:**
- ✅ Update single field
- ✅ Update multiple fields
- ✅ Empty update (should succeed)
- ✅ 404 for non-existent
- ✅ 400 for invalid UUID
- ✅ 400 for invalid enum
- ✅ Validate original vs updated values

**IMPORTANT NOTE:** Update tests run sequentially and share state! Each test updates the same entity, so later tests see previous updates. This is intentional for testing stateful updates.

---

### 5. Delete Tests (`delete-{entity}.spec.ts`)

**Template:**
```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { mockEntity } from '@/domain/base/entity/entity.factory';
import { EntityService } from '@/domain/base/entity/entity.service';
import {
  createBackendTestingModule,
  getBaseTestHeader,
  startE2e,
  stopE2e,
  testTransactionRollback,
  testTransactionStart,
} from '@/infra/test/test-util/test-util.common';

import { EntitiesV1Module } from '../entities.v1.module';
import { DeleteEntityResponse } from './delete-entity.dto';

async function setup(app: INestApplication) {
  const entityService = app.get(EntityService);

  const entity = mockEntity({
    field1: 'To Delete',
    field2: 'Delete Value',
    status: 'ACTIVE',
  });

  await entityService.save(entity);

  return { entity };
}

describe('DELETE /v1/entities/:id', () => {
  let app: INestApplication;
  let headers: Record<string, string>;
  let testData: Awaited<ReturnType<typeof setup>>;

  beforeAll(async () => {
    const module = await createBackendTestingModule(EntitiesV1Module).compile();

    app = await startE2e(module);
    headers = await getBaseTestHeader();

    await testTransactionStart(app);

    testData = await setup(app);
  });

  afterAll(async () => {
    await testTransactionRollback(app);
    stopE2e(app);
  });

  it('should delete entity by id', async () => {
    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/entities/${testData.entity.id}`)
      .set(headers);

    const { success, data } = body as DeleteEntityResponse;

    expect(status).toBe(200);
    expect(success).toBe(true);
    expect(data.entity.attributes.id).toBe(testData.entity.id);
    expect(data.entity.attributes.field1).toBe('To Delete');
    expect(data.entity.attributes.field2).toBe('Delete Value');
    expect(data.entity.attributes.status).toBe('ACTIVE');
  });

  it('should verify entity is deleted', async () => {
    const entityService = app.get(EntityService);

    // Delete the entity
    await request(app.getHttpServer())
      .delete(`/v1/entities/${testData.entity.id}`)
      .set(headers);

    // Try to get it
    const deleted = await entityService.findOne(testData.entity.id);

    expect(deleted).toBeNull();
  });

  it('should return 404 for non-existent entity', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/entities/${fakeId}`)
      .set(headers);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('should return 400 for invalid UUID', async () => {
    const { status, body } = await request(app.getHttpServer())
      .delete('/v1/entities/not-a-valid-uuid')
      .set(headers);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('should return 404 when deleting already deleted', async () => {
    // Delete first time
    await request(app.getHttpServer())
      .delete(`/v1/entities/${testData.entity.id}`)
      .set(headers);

    // Try to delete again
    const { status, body } = await request(app.getHttpServer())
      .delete(`/v1/entities/${testData.entity.id}`)
      .set(headers);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
```

**Test Coverage:**
- ✅ Delete by ID
- ✅ Verify deletion (entity no longer exists)
- ✅ 404 for non-existent
- ✅ 400 for invalid UUID
- ✅ 404 for already deleted
- ✅ Validate returned deleted data

---

### Critical Testing Principles

#### 1. **Use Constant Test Data**

❌ **BAD** - Dynamic data:
```typescript
const user = mockUser();  // Random data
```

✅ **GOOD** - Constant data:
```typescript
const user = mockUser({
  email: 'alice@test.com',
  firstName: 'Alice',
  lastName: 'Anderson',
});
```

**Why?**
- Tests are predictable and repeatable
- Easy to debug failures
- Clear assertions on specific values
- No flaky tests from random data

#### 2. **Assert on Constant Values**

❌ **BAD** - No assertion on actual values:
```typescript
expect(data.user).toBeDefined();
```

✅ **GOOD** - Assert exact values:
```typescript
expect(data.user.attributes.email).toBe('alice@test.com');
expect(data.user.attributes.firstName).toBe('Alice');
```

#### 3. **Correct Response Structure**

❌ **BAD** - Wrong structure:
```typescript
expect(data.user.email).toBe('test@test.com');  // Missing .attributes
expect(data.user.posts).toBeDefined();  // Missing .relations
```

✅ **GOOD** - Correct structure:
```typescript
expect(data.user.attributes.email).toBe('test@test.com');
expect(data.user.relations?.posts).toBeDefined();
expect(data.user.relations?.posts?.[0].attributes.title).toBe('Post Title');
```

#### 4. **Setup Function Pattern**

```typescript
async function setup(app: INestApplication) {
  // Get services
  const service1 = app.get(Service1);
  const service2 = app.get(Service2);

  // Create test data with CONSTANT values
  const entity1 = mockEntity({ field: 'Constant Value' });
  const entity2 = mockEntity({ field: 'Another Constant' });

  // Save to database
  await service1.saveBulk([entity1, entity2]);

  // Return for use in tests
  return { entity1, entity2 };
}
```

**Rules:**
- Always use constant values in mocks
- Create all necessary dependencies
- Return all data needed by tests
- Keep setup focused and minimal

#### 5. **Test Lifecycle**

```typescript
describe('GET /v1/entities', () => {
  let app: INestApplication;
  let headers: Record<string, string>;

  beforeAll(async () => {
    // 1. Create test module
    const module = await createBackendTestingModule(EntitiesV1Module).compile();

    // 2. Start E2E app
    app = await startE2e(module);
    
    // 3. Get auth headers
    headers = await getBaseTestHeader();

    // 4. Start transaction
    await testTransactionStart(app);

    // 5. Setup test data
    await setup(app);
  });

  afterAll(async () => {
    // 1. Rollback transaction (cleanup)
    await testTransactionRollback(app);
    
    // 2. Stop app
    stopE2e(app);
  });

  // Tests here...
});
```

**Key Points:**
- Transaction ensures test isolation
- Data is rolled back after tests
- No test pollution between files

#### 6. **Query Parameter Format**

For list endpoints, query parameters are **strings**:

```typescript
const query: ListEntitiesQueryInput = {
  pagination: {
    page: '1',      // String, not number
    perPage: '2',   // String, not number
  },
  sort: 'field1',   // String
  filter: {
    status: 'ACTIVE',
  },
  includes: 'relation1,relation1.nested',
};
```

---

## Bruno API Specification

Bruno is used for API testing and documentation. Create .bru files at `bruno/v1/{entities}/` to document all API endpoints.

### Bruno Directory Structure

```
bruno/v1/{entities}/
├── folder.bru                  # Folder metadata
├── create-{entity}.bru         # POST endpoint
├── list-{entities}.bru         # GET list endpoint
├── get-{entity}.bru            # GET single endpoint
├── update-{entity}.bru         # PATCH endpoint
└── delete-{entity}.bru         # DELETE endpoint
```

### Bruno File Format

Each .bru file contains:
- **meta block**: Name, type, and sequence
- **HTTP method block**: URL, body type, auth mode
- **params blocks**: Path parameters and query parameters
- **body block**: Request body (for POST/PATCH)

### Template: folder.bru

```
meta {
  name: {entities}
  seq: 4
}

auth {
  mode: inherit
}
```

### Template: create-{entity}.bru

```
meta {
  name: create-{entity}
  type: http
  seq: 1
}

post {
  url: {{url}}/v1/{entities}
  body: json
  auth: inherit
}

body:json {
  {
    "field1": "value1",
    "field2": "value2",
    "status": "ACTIVE"
  }
}
```

**Key Points:**
- Uses `post` method block
- `body: json` indicates JSON payload
- `auth: inherit` uses parent folder's auth
- `{{url}}` is a Bruno environment variable

### Template: list-{entities}.bru

```
meta {
  name: list-{entities}
  type: http
  seq: 2
}

get {
  url: {{url}}/v1/{entities}?includes=relation1,relation1.nested&sort=field1&page=1&perPage=10&filter[status]=ACTIVE&countFilter[isDeleted]=false
  body: none
  auth: inherit
}

params:query {
  ~includes: relation1,relation1.nested
  ~sort: field1
  ~page: 1
  ~perPage: 10
  ~filter[status]: ACTIVE
  ~countFilter[isDeleted]: false
}
```

**Key Points:**
- Uses `get` method block
- `body: none` for GET requests
- `params:query` lists all available query parameters
- `~` prefix means parameter is disabled by default (optional)
- Shows all available includes, filters, sorting options
- `filter[field]` for main query filtering
- `countFilter[field]` for count query filtering

**Available Query Parameters:**
- `includes`: Comma-separated list of relations to include
- `sort`: Field name for sorting (add `-` prefix for descending)
- `page`: Page number (starts at 1)
- `perPage`: Items per page
- `filter[field]`: Filter on specific field
- `countFilter[field]`: Filter for counting total records

### Template: get-{entity}.bru

```
meta {
  name: get-{entity}
  type: http
  seq: 3
}

get {
  url: {{url}}/v1/{entities}/:id?includes=relation1,relation1.nested
  body: none
  auth: inherit
}

params:path {
  id: 019be136-827e-7c83-a055-f4dc6845e8fb
}

params:query {
  ~includes: relation1,relation1.nested
}
```

**Key Points:**
- Uses `:id` path parameter
- `params:path` block defines path variables
- Include sample UUID in path params
- Optional `includes` query parameter for relations

### Template: update-{entity}.bru

```
meta {
  name: update-{entity}
  type: http
  seq: 4
}

patch {
  url: {{url}}/v1/{entities}/:id
  body: json
  auth: inherit
}

params:path {
  id: 019be136-827e-7c83-a055-f4dc6845e8fb
}

body:json {
  {
    "field1": "updated value",
    "field2": "updated value"
  }
}
```

**Key Points:**
- Uses `patch` method block
- Requires `:id` path parameter
- Body contains fields to update (partial update supported)
- No need to include all fields, only fields being updated

### Template: delete-{entity}.bru

```
meta {
  name: delete-{entity}
  type: http
  seq: 5
}

delete {
  url: {{url}}/v1/{entities}/:id
  body: none
  auth: inherit
}

params:path {
  id: 019be136-827e-7c83-a055-f4dc6845e8fb
}
```

**Key Points:**
- Uses `delete` method block
- Requires `:id` path parameter
- `body: none` as DELETE typically doesn't need a body
- Returns confirmation response

### Bruno Best Practices

1. **Environment Variables**: Use `{{url}}` for base URL (defined in bruno/environments/)
2. **Sequential Numbering**: Use `seq` field to order endpoints logically (1=create, 2=list, 3=get, 4=update, 5=delete)
3. **Sample Data**: Include realistic sample data in body and path params
4. **Optional Params**: Use `~` prefix for optional query parameters
5. **Complete Documentation**: Show ALL available query parameters in list endpoints
6. **Auth Inheritance**: Use `auth: inherit` to inherit from parent folder
7. **Consistency**: Follow the same structure across all entity endpoints

---

## Step-by-Step Implementation

### Prerequisites

Before creating CRUD APIs, ensure the domain layer exists:

**Required Domain Files:**
1. `src/domain/base/{entity}/{entity}.domain.ts` - Domain class
2. `src/domain/base/{entity}/{entity}.factory.ts` - Factory & mock functions
3. `src/domain/base/{entity}/{entity}.mapper.ts` - Mappers (PG ↔ Domain ↔ Response)
4. `src/domain/base/{entity}/{entity}.service.ts` - Service layer
5. `src/domain/base/{entity}/{entity}.type.ts` - Type definitions
6. `src/domain/base/{entity}/{entity}.util.ts` - Constants & filters
7. `src/domain/base/{entity}/{entity}.zod.ts` - Zod schemas for filter/sort

### Step 1: Create Directory Structure

```bash
# Create API directory structure
mkdir -p src/app/api/v1/{entities}/{create,list,get,update,delete}-{entity}

# Create Bruno API documentation directory
mkdir -p bruno/v1/{entities}
```

### Step 2: Create Utilities File

Start with `{entities}.v1.util.ts` to define includes:

```typescript
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import z from 'zod';
import { SelectQB } from '@/infra/db/db.common';
import { getIncludesZod } from '@/shared/zod/zod.util';

export const entitiesV1IncludesZod = getIncludesZod(['relation1', 'relation1.nested']);

export function entitiesV1InclusionQb(
  qb: SelectQB<'{entities}' >,
  includes: z.infer<typeof entitiesV1IncludesZod>,
) {
  return qb.$if(includes.has('relation1'), (q) =>
    q.select((eb) =>
      jsonArrayFrom(
        eb.selectFrom('relation_table')
          .whereRef('relation_table.entity_id', '=', 'entities.id')
          .selectAll('relation_table'),
      ).as('relation1'),
    ),
  );
}
```

### Step 3: Create DTOs

Create all DTO files defining inputs and outputs for each operation.

### Step 4: Create Commands/Queries

Implement the business logic for each operation.

### Step 5: Create Controller

Wire up all endpoints in the controller.

### Step 6: Create Module

Register all providers and controllers.

### Step 7: Write Tests

Create comprehensive E2E tests for each endpoint.

### Step 8: Create Bruno API Specs

Create .bru files in `bruno/v1/{entities}/`:
- `folder.bru` - Folder metadata
- `create-{entity}.bru` - POST endpoint documentation
- `list-{entities}.bru` - GET list endpoint with all query params
- `get-{entity}.bru` - GET single endpoint with includes
- `update-{entity}.bru` - PATCH endpoint
- `delete-{entity}.bru` - DELETE endpoint

See [Bruno API Specification](#bruno-api-specification) section for templates.

### Step 9: Verify

Run tests:
```bash
npm run test src/app/api/v1/{entities}
```

---

## Common Patterns

### Working with Enums

```typescript
// In domain util file
export const ENTITY_STATUS = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;

// In DTO
import { ENTITY_STATUS } from '@/domain/base/entity/entity.util';

const zod = z.object({
  status: z.enum(ENTITY_STATUS).optional(),
});
```

### Optional vs Required Fields

```typescript
// Create DTO - some required, some optional
const createZod = z.object({
  requiredField: z.string(),          // Required
  optionalField: z.string().optional(), // Optional
});

// Update DTO - all optional
const updateZod = z.object({
  field1: z.string().optional(),
  field2: z.string().optional(),
});
```

### Handling Relations

```typescript
// Map relations in query
relations: {
  posts: orUndefined(raw.posts, (posts) =>
    posts.map((post) => ({
      attributes: postPgToResponse(post),
      relations: {
        comments: orUndefined(post.comments, (comments) =>
          comments.map((c) => ({ attributes: commentPgToResponse(c) })),
        ),
      },
    })),
  ),
}
```

### Error Handling

```typescript
// 404 Not Found
if (!result) {
  throw new ApiException(404, 'entityNotFound');
}

// ParseUUIDPipe automatically handles invalid UUIDs (400)
@Get(':id')
async getEntity(@Param('id', ParseUUIDPipe) id: string) {
  // ...
}
```

---

## Checklist

Before submitting a CRUD implementation, verify:

- [ ] All 5 operations implemented (Create, List, Get, Update, Delete)
- [ ] All DTOs define proper Zod schemas
- [ ] Response types use `IResponse`/`IResponseRelations`
- [ ] Controller uses `ParseUUIDPipe` for `:id` params
- [ ] Utilities define includes correctly
- [ ] Module registers all providers
- [ ] Tests use constant data (not faker/random)
- [ ] Tests assert on specific constant values
- [ ] Tests use correct response structure (`attributes`/`relations`)
- [ ] Tests cover success and error cases
- [ ] All tests pass
- [ ] Response structure matches standard format
- [ ] Bruno specs created for all 5 operations
- [ ] Bruno folder.bru created with proper metadata
- [ ] All query parameters documented in list-{entities}.bru

---

## Summary

This pattern ensures:
- **Consistency**: All APIs follow the same structure
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Testability**: Comprehensive E2E tests with constant data
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new operations or relations

When creating a new CRUD API:
1. Reference only this guide, schema.dbml (to see relations) and the domain files (`src/domain/base/{entity}/**`)
3. Follow the templates exactly
4. Use constant test data
5. Assert on specific values
6. Follow the response structure pattern
