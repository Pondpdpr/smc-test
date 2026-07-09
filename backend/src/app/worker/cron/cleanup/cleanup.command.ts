import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import pLimit from 'p-limit';

import {
  STORED_FILE_PUBLIC_STORAGE_KEY_PREFIX,
  STORED_FILE_STORAGE_KEY_PREFIX,
} from '@/domain/base/stored-file/stored-file.constant';
import { MainDb } from '@/infra/db/db.main';
import { StorageService } from '@/infra/global/storage/storage.service';
import myDayjs from '@/shared/common/common.dayjs';

@Injectable()
export class CleanupCommand {
  constructor(
    private readonly db: MainDb,
    private readonly storageService: StorageService,
  ) {}

  async exec() {
    await this.cleanExpireMessageTasks();
    await this.cleanExpireSessions();
    await this.cleanStoredFiles();
    await this.cleanStorageStoredFiles();
  }

  async cleanExpireMessageTasks() {
    await this.db.write
      .deleteFrom('message_tasks')
      .where('expire_at', '<=', myDayjs().toISOString())
      .execute();
  }

  async cleanExpireSessions() {
    await this.db.write
      .deleteFrom('sessions')
      .where('expire_at', '<=', myDayjs().toISOString())
      .execute();
  }

  async cleanStoredFiles() {
    // clean expire
    await this.db.write
      .deleteFrom('stored_files')
      .where('expire_at', '<=', myDayjs().toISOString())
      .execute();

    // clean orphan
    const res = await this.db.read
      .selectFrom('stored_files')
      .select(['owner_table'])
      .distinct()
      .execute();

    const uniqueOwnerTables = res.map((r) => r.owner_table);

    const promProcess: Promise<any>[] = [];
    const conLimit = pLimit(10);

    for (const ownerTable of uniqueOwnerTables) {
      const orphanedSub = this.db.read
        .selectFrom('stored_files')
        .select(['stored_files.id'])
        .distinct()
        .where('owner_table', '=', ownerTable)
        .where(sql.ref(`${ownerTable}.id`), 'is', null)
        .leftJoin(ownerTable as any, (join) =>
          join.onRef('stored_files.owner_id', '=', sql.ref(`${ownerTable}.id`)),
        );

      const prom = this.db.write
        .deleteFrom('stored_files')
        .where('id', 'in', orphanedSub)
        .execute();

      promProcess.push(conLimit(() => prom));
    }

    await Promise.all(promProcess);
  }

  async cleanStorageStoredFiles() {
    if (!this.storageService.enable) {
      return;
    }

    const conLimit = pLimit(10);
    const storagePrefix = [
      // add slash to ensure its a folder
      STORED_FILE_STORAGE_KEY_PREFIX + '/',
      STORED_FILE_PUBLIC_STORAGE_KEY_PREFIX + '/',
    ] as const;

    for (const prefix of storagePrefix) {
      let continuationToken: string | undefined = undefined;

      do {
        // max 1000
        const res = await this.storageService.list({
          prefix,
          continuationToken,
        });

        const content = res.content;
        continuationToken = res.continuationToken;

        if (!content.length) {
          break;
        }

        // extract keys
        const keys = content.map((o) => o.Key!).filter((o) => !!o);
        const existing = await this.db.read
          .selectFrom('stored_files')
          .select(['key_path'])
          .where('key_path', 'in', keys)
          .execute();

        const existingSet = new Set(existing.map((e) => e.key_path));
        const orphans = keys.filter((k) => !existingSet.has(k));

        await Promise.all(
          orphans.map((k) => conLimit(() => this.storageService.remove(k))),
        );
      } while (continuationToken);
    }
  }
}
