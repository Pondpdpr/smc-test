import * as fs from 'fs';
import { Command, CommandRunner, Option } from 'nest-commander';
import * as path from 'path';
import { Project, SyntaxKind, TypeAliasDeclaration } from 'ts-morph';

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldInfo = {
  name: string;
  isReadonly: boolean;
  isNullable: boolean;
  isOptional: boolean;
  kind: 'string' | 'number' | 'boolean' | 'Date' | 'other';
};

type DomainMeta = {
  entityName: string; // Employee
  pgInterfaceName: string; // Employees
  tableName: string; // employees
  baseName: string; // employee-attendance
  camelName: string; // employeeAttendance
  pluralCamelName: string; // employeeAttendances
  fields: FieldInfo[];
  isMutable: boolean; // has UpdateData type
  domainFilePath: string;
  domainDir: string;
  domainImportAlias: string; // e.g. ./employee-attendance.domain
};

// ─── CLI Command ─────────────────────────────────────────────────────────────

@Command({
  name: 'codegen:domain',
  description: 'Generate domain boilerplate files from a *.domain.ts file',
  arguments: '<domain-file>',
})
export class DomainCodeGenCli extends CommandRunner {
  async run(
    passedParams: string[],
    options: { force?: boolean },
  ): Promise<void> {
    const domainFilePath = path.resolve(process.cwd(), passedParams[0]);

    if (!fs.existsSync(domainFilePath)) {
      console.error(`File not found: ${domainFilePath}`);
      process.exit(1);
    }

    const meta = this._parseDomain(domainFilePath);
    this._generate(meta, options.force ?? false);
  }

  @Option({
    flags: '-f, --force',
    description: 'Overwrite existing files',
  })
  parseForce(): boolean {
    return true;
  }

  // ─── Parser ──────────────────────────────────────────────────────────────

  private _parseDomain(filePath: string): DomainMeta {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Derive entity name from file name: employee-attendance.domain.ts → EmployeeAttendance
    const baseName = path.basename(filePath, '.domain.ts');
    const entityName = baseName
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');
    const camelName = entityName.charAt(0).toLowerCase() + entityName.slice(1);
    const pluralCamelName = camelName + 's';

    // Extract PG interface name from: export type EmployeePg = DBModel<Employees>
    const pgTypeName = `${entityName}Pg`;
    const pgTypeAlias = sourceFile.getTypeAliasOrThrow(pgTypeName);
    const pgTypeText = pgTypeAlias.getTypeNode()!.getText();
    const pgMatch = pgTypeText.match(/DBModel<(\w+)>/);
    if (!pgMatch) {
      throw new Error(`Could not find DBModel<T> in ${pgTypeName}`);
    }
    const pgInterfaceName = pgMatch[1]; // e.g. Employees
    const tableName = this._toSnakeCase(pgInterfaceName); // e.g. employees

    // Extract plain type fields
    const plainTypeName = `${entityName}Plain`;
    // The plain type is local (not exported) so we find it by name
    const plainTypeAlias = sourceFile
      .getTypeAliases()
      .find((t) => t.getName() === plainTypeName);

    if (!plainTypeAlias) {
      throw new Error(`Could not find type ${plainTypeName} in ${filePath}`);
    }

    const fields = this._extractFields(plainTypeAlias);

    // Check for UpdateData type
    const isMutable = !!sourceFile
      .getTypeAliases()
      .find((t) => t.getName() === `${entityName}UpdateData`);

    return {
      entityName,
      pgInterfaceName,
      tableName,
      baseName,
      camelName,
      pluralCamelName,
      fields,
      isMutable,
      domainFilePath: filePath,
      domainDir: path.dirname(filePath),
      domainImportAlias: `./${baseName}.domain`,
    };
  }

  private _extractFields(typeAlias: TypeAliasDeclaration): FieldInfo[] {
    const typeNode = typeAlias.getTypeNode();
    if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeLiteral) {
      return [];
    }

    const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);
    return typeLiteral
      .getMembers()
      .map((member) => {
        const prop = member.asKind(SyntaxKind.PropertySignature);
        if (!prop) return null;

        const name = prop.getName();
        const isReadonly = prop.isReadonly();
        const isOptional = prop.hasQuestionToken();
        const typeText = prop.getTypeNode()?.getText() ?? 'unknown';
        const isNullable = typeText.includes('| null');
        const baseType = typeText.replace('| null', '').replace('?', '').trim();

        let kind: FieldInfo['kind'] = 'other';
        if (baseType === 'string' || baseType === 'Numeric') kind = 'string';
        else if (baseType === 'number') kind = 'number';
        else if (baseType === 'boolean') kind = 'boolean';
        else if (baseType === 'Date') kind = 'Date';

        return { name, isReadonly, isNullable, isOptional, kind } as FieldInfo;
      })
      .filter(Boolean) as FieldInfo[];
  }

  // ─── Generator ───────────────────────────────────────────────────────────

  private _generate(meta: DomainMeta, force: boolean): void {
    const files: Record<string, string> = {
      [`${meta.baseName}.factory.ts`]: this._genFactory(meta),
      [`${meta.baseName}.mapper.ts`]: this._genMapper(meta),
      [`${meta.baseName}.util.ts`]: this._genUtil(meta),
      [`${meta.baseName}.service.ts`]: this._genService(meta),
      [`${meta.baseName}.module.ts`]: this._genModule(meta),
    };

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(meta.domainDir, filename);
      if (fs.existsSync(filePath) && !force) {
        console.log(`  skip  ${filename} (use --force to overwrite)`);
        continue;
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  write ${filename}`);
    }
  }

  // ─── Templates ───────────────────────────────────────────────────────────

  private _genFactory(meta: DomainMeta): string {
    const { entityName, pluralCamelName, fields, domainImportAlias } = meta;

    const mockFields = fields
      .map((f) => {
        const val = this._mockValue(f);
        return `    ${f.name}: valueOr(data?.${f.name}, ${val}),`;
      })
      .join('\n');

    return `import { uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { valueOr } from '@/shared/common/common.func';

import type { ${entityName} } from '${domainImportAlias}';

export function mock${entityName}(data?: Partial<${entityName}>): ${entityName} {
  return {
${mockFields}
  };
}

export function mock${pluralCamelName.charAt(0).toUpperCase() + pluralCamelName.slice(1)}(
  amount: number,
  data?: Partial<${entityName}>,
): ${entityName}[] {
  return Array(amount)
    .fill(0)
    .map(() => mock${entityName}(data));
}
`;
  }

  private _genMapper(meta: DomainMeta): string {
    const { entityName, camelName, fields, domainImportAlias } = meta;
    const pgName = `${entityName}Pg`;
    const jsonName = `${entityName}Json`;
    const responseName = `${entityName}Response`;

    // fromPg body
    const fromPgFields = fields
      .map((f) => {
        const pgKey = this._toSnakeCase(f.name);
        if (f.kind === 'Date') {
          return f.isNullable
            ? `    ${f.name}: pg.${pgKey} ? toDate(pg.${pgKey}) : null,`
            : `    ${f.name}: toDate(pg.${pgKey}),`;
        }
        return `    ${f.name}: pg.${pgKey},`;
      })
      .join('\n');

    // fromJson body
    const fromJsonFields = fields
      .map((f) => {
        if (f.kind === 'Date') {
          return f.isNullable
            ? `    ${f.name}: data.${f.name} ? toDate(data.${f.name}) : null,`
            : `    ${f.name}: toDate(data.${f.name}),`;
        }
        return `    ${f.name}: data.${f.name},`;
      })
      .join('\n');

    // toPg body
    const toPgFields = fields
      .map((f) => {
        const pgKey = this._toSnakeCase(f.name);
        if (f.kind === 'Date') {
          return f.isNullable
            ? `    ${pgKey}: ${camelName}.${f.name}?.toISOString() ?? null,`
            : `    ${pgKey}: ${camelName}.${f.name}.toISOString(),`;
        }
        return `    ${pgKey}: ${camelName}.${f.name},`;
      })
      .join('\n');

    // toResponse body
    const toResponseFields = fields
      .map((f) => {
        if (f.kind === 'Date') {
          return f.isNullable
            ? `    ${f.name}: ${camelName}.${f.name} ? toResponseDate(${camelName}.${f.name}) : null,`
            : `    ${f.name}: toResponseDate(${camelName}.${f.name}),`;
        }
        return `    ${f.name}: ${camelName}.${f.name},`;
      })
      .join('\n');

    // toJson body
    const toJsonFields = fields
      .map((f) => {
        if (f.kind === 'Date') {
          return f.isNullable
            ? `    ${f.name}: ${camelName}.${f.name} ? toISO(${camelName}.${f.name}) : null,`
            : `    ${f.name}: toISO(${camelName}.${f.name}),`;
        }
        return `    ${f.name}: ${camelName}.${f.name},`;
      })
      .join('\n');

    const transformerImports = ['toDate', 'toISO', 'toResponseDate'].join(
      ',\n  ',
    );

    return `import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import {
  ${transformerImports},
} from '@/shared/common/common.transformer';

import type {
  ${jsonName},
  ${pgName},
  ${responseName},
} from '${domainImportAlias}';
import { ${entityName} } from '${domainImportAlias}';

export function ${camelName}FromPg(pg: ${pgName}): ${entityName} {
  const ${camelName}: ${entityName} = {
${fromPgFields}
  };
  return setPgState(${camelName}, pg);
}

export function ${camelName}FromJson(data: ${jsonName}): ${entityName} {
  return {
${fromJsonFields}
    [$pgState]: getPgState(data),
  };
}

export function ${camelName}ToPg(${camelName}: ${entityName}): ${pgName} {
  return {
${toPgFields}
  };
}

export function ${camelName}ToResponse(${camelName}: ${entityName}): ${responseName} {
  return {
${toResponseFields}
  };
}

export function ${camelName}ToJson(${camelName}: ${entityName}): ${jsonName} {
  return {
${toJsonFields}
    [$pgState]: getPgState(${camelName}),
  };
}
`;
  }

  private _genUtil(meta: DomainMeta): string {
    const {
      entityName,
      pluralCamelName,
      tableName,
      fields,
      isMutable,
      domainImportAlias,
    } = meta;

    const newEntityFields = fields
      .map((f) => {
        if (f.name === 'id') return `    id: uuidV7(),`;
        if (f.name === 'createdAt') return `    createdAt: myDayjs().toDate(),`;
        if (f.name === 'updatedAt') return `    updatedAt: myDayjs().toDate(),`;
        const isOptionalInNewData = f.isNullable || f.isOptional;
        return isOptionalInNewData
          ? `    ${f.name}: data.${f.name} ?? null,`
          : `    ${f.name}: data.${f.name},`;
      })
      .join('\n');

    const updateTypeImport = isMutable ? `, ${entityName}UpdateData` : '';

    let editFn = '';
    if (isMutable) {
      const readonlyPassthrough = fields
        .filter((f) => f.isReadonly || f.name === 'id')
        .filter((f) => f.name !== 'updatedAt')
        .map((f) => `    ${f.name}: entity.${f.name},`)
        .join('\n');

      const mutableFields = fields.filter(
        (f) =>
          !f.isReadonly &&
          f.name !== 'updatedAt' &&
          f.name !== 'createdAt' &&
          f.name !== 'id',
      );

      const updateFields = mutableFields
        .map((f) => {
          if (f.isNullable) {
            return `    ${f.name}: data.${f.name} !== undefined ? data.${f.name} : entity.${f.name},`;
          }
          return `    ${f.name}: valueOr(data.${f.name}, entity.${f.name}),`;
        })
        .join('\n');

      editFn = `
export function edit${entityName}(
  entity: ${entityName},
  data: ${entityName}UpdateData,
): ${entityName} {
  return {
    [$pgState]: getPgState(entity),
${readonlyPassthrough}

    // Update
${updateFields}
    updatedAt: myDayjs().toDate(),
  };
}
`;
    }

    const domainImports = [
      `${entityName}`,
      `${entityName}NewData${updateTypeImport}`,
    ].join(', ');

    return `import type { EB } from '@/infra/db/db.common';
import { uuidV7 } from '@/shared/common/common.crypto';
import myDayjs from '@/shared/common/common.dayjs';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import type { ${domainImports} } from '${domainImportAlias}';

export function ${pluralCamelName}TableFilter(eb: EB<'${tableName}'>) {
  return eb.and([]);
}

export function new${entityName}(data: ${entityName}NewData): ${entityName} {
  return {
${newEntityFields}
  };
}

export function new${pluralCamelName.charAt(0).toUpperCase() + pluralCamelName.slice(1)}(data: ${entityName}NewData[]): ${entityName}[] {
  return data.map((d) => new${entityName}(d));
}
${editFn}`;
  }

  private _genService(meta: DomainMeta): string {
    const {
      entityName,
      baseName,
      camelName,
      pluralCamelName,
      tableName,
      isMutable,
      domainImportAlias,
    } = meta;

    const updateMethod = isMutable
      ? `
  private async _update(id: string, ${camelName}: ${entityName}) {
    const data = diff(getPgState(${camelName}), ${camelName}ToPg(${camelName}));
    if (!data) {
      return;
    }

    await this.db.write
      .updateTable('${tableName}')
      .set(data)
      .where('id', '=', id)
      .execute();
  }`
      : '';

    const saveBody = isMutable
      ? `    if (!isPersist(${camelName})) {
      await this._create(${camelName});
    } else {
      await this._update(${camelName}.id, ${camelName});
    }`
      : `    if (!isPersist(${camelName})) {
      await this._create(${camelName});
    }`;

    const diffImport = isMutable
      ? `\nimport { diff } from '@/shared/common/common.func';`
      : '';

    return `import { Injectable } from '@nestjs/common';

import { MainDb } from '@/infra/db/db.main';
import {
  getPgState,
  isPersist,
  setPgState,
} from '@/shared/common/common.domain';${diffImport}

import { ${entityName} } from '${domainImportAlias}';
import { ${camelName}FromPg, ${camelName}ToPg } from './${baseName}.mapper';

@Injectable()
export class ${entityName}Service {
  constructor(private db: MainDb) {}

  async findOne(id: string) {
    const pg = await this.db.read
      .selectFrom('${tableName}')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!pg) {
      return null;
    }

    return ${camelName}FromPg(pg);
  }

  async save(${camelName}: ${entityName}) {
    this._validate(${camelName});

${saveBody}

    setPgState(${camelName}, ${camelName}ToPg(${camelName}));
  }

  async saveBulk(${pluralCamelName}: ${entityName}[]) {
    return Promise.all(${pluralCamelName}.map((e) => this.save(e)));
  }

  private _validate(_${camelName}: ${entityName}) {
    // no rule for now
  }

  private async _create(${camelName}: ${entityName}) {
    await this.db.write
      .insertInto('${tableName}')
      .values(${camelName}ToPg(${camelName}))
      .execute();
  }${updateMethod}
}
`;
  }

  private _genModule(meta: DomainMeta): string {
    const { entityName, baseName } = meta;

    return `import { Module } from '@nestjs/common';

import { ${entityName}Service } from './${baseName}.service';

@Module({
  providers: [${entityName}Service],
  exports: [${entityName}Service],
})
export class ${entityName}Module {}
`;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  private _mockValue(field: FieldInfo): string {
    if (field.isNullable) return 'null';
    switch (field.kind) {
      case 'string':
        return `'sample-${field.name}'`;
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'Date': {
        if (field.name === 'id') return 'uuidV7()';
        return 'myDayjs().toDate()';
      }
      default:
        return 'null';
    }
  }
}
