import { Injectable } from '@nestjs/common';
import { unique } from 'remeda';
import { Writable } from 'type-fest';

import { MainDb } from '@/infra/db/db.main';
import { StorageService } from '@/infra/global/storage/storage.service';
import { streamToBuffer } from '@/shared/common/common.buffer';
import { uuidV7 } from '@/shared/common/common.crypto';
import { getPgState, setPgState } from '@/shared/common/common.domain';
import { diff } from '@/shared/common/common.func';
import { DayjsDuration } from '@/shared/type/type.common';

import { StoredFile } from './stored-file.domain';
import { storedFileFromPg, storedFileToPg } from './stored-file.mapper';
import { GetPresignUploadUrlOpts } from './stored-file.type';
import { getStoredFileKey, isStoredFileChanged } from './stored-file.util';

@Injectable()
export class StoredFileService {
  constructor(
    private db: MainDb,
    private storageService: StorageService,
  ) {}

  async findOne(id: string): Promise<StoredFile | null> {
    const storedFilePg = await this.db.read
      .selectFrom('stored_files')
      .selectAll()
      .where('id', '=', id)
      .limit(1)
      .executeTakeFirst();

    if (!storedFilePg) {
      return null;
    }

    const storedFile = storedFileFromPg(storedFilePg);
    return storedFile;
  }

  async save(storedFile: StoredFile) {
    await this._deleteRelated([storedFile.ownerId]);
    await this._create(storedFile);
  }

  async saveBulk(storedFiles: StoredFile[]) {
    if (!storedFiles.length) {
      return;
    }

    await this._deleteRelated(unique(storedFiles.map((s) => s.ownerId)));
    return Promise.all(storedFiles.map((s) => this._create(s)));
  }

  private async _create(storedFile: StoredFile) {
    this._validate(storedFile);

    await this.setMetaInfo(storedFile);

    // create every time
    await this.db.write
      //
      .insertInto('stored_files')
      .values(storedFileToPg(storedFile))
      .execute();

    setPgState(storedFile, storedFileToPg(storedFile));
  }

  private async _update(id: string, storedFile: StoredFile): Promise<void> {
    const data = diff(getPgState(storedFile), storedFileToPg(storedFile));
    if (!data) {
      return;
    }

    await this.db.write
      //
      .updateTable('stored_files')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  async delete(storedFile: StoredFile) {
    await this.db.write
      //
      .deleteFrom('stored_files')
      .where('id', '=', storedFile.id)
      .execute();
  }

  private async _deleteRelated(ownerIds: string[]): Promise<void> {
    await this.db.write
      //
      .deleteFrom('stored_files')
      .where('owner_id', 'in', ownerIds)
      .execute();
  }

  private _validate(_storedFile: StoredFile) {
    // validation rules can be added here
  }

  async getPresignUploadUrlBulk(amount: number, opts: GetPresignUploadUrlOpts) {
    const amountArray = Array.from({ length: amount }).fill(0);

    return Promise.all(
      amountArray.map(async () =>
        this.getPresignUploadUrl({
          ownerTable: opts.ownerTable,
          fileExposeType: opts.fileExposeType,
        }),
      ),
    );
  }

  async getPresignUploadUrl(opts: GetPresignUploadUrlOpts) {
    const id = uuidV7();

    const key = getStoredFileKey({
      id,
      ownerTable: opts.ownerTable,
      fileExposeType: opts.fileExposeType,
    });
    const presignUrl = await this.storageService.createUploadPresign(key);

    return {
      id,
      presignUrl,
    };
  }

  async getStream(storedFile: StoredFile) {
    return this.storageService.get(storedFile.keyPath);
  }

  async getBuffer(storedFile: StoredFile) {
    const readable = await this.getStream(storedFile);
    if (!readable) {
      return null;
    }

    const buffer = await streamToBuffer(readable);
    return buffer;
  }

  async setMetaInfo(storedFile: StoredFile) {
    if (!isStoredFileChanged(storedFile)) {
      return;
    }

    const { mimetype, checksum, sizeBytes } =
      await this.storageService.getObjectMeta(storedFile.keyPath);
    const writeStoredFile = storedFile as Writable<typeof storedFile>;

    writeStoredFile.mimeType = mimetype;
    writeStoredFile.checksum = checksum;
    if (sizeBytes) {
      writeStoredFile.filesizeByte = sizeBytes;
    }

    await this.setPresigned(storedFile);
  }

  async setPresigned(
    storedFile: StoredFile,
    opts?: { expiresIn?: DayjsDuration },
  ) {
    if (!isStoredFileChanged(storedFile)) {
      return;
    }

    const presignUrl = await this.storageService.getPresigned(
      storedFile.keyPath,
      { expiresIn: opts?.expiresIn || { days: 1 } },
    );

    const writeStoredFile = storedFile as Writable<typeof storedFile>;
    writeStoredFile.presignUrl = presignUrl;
  }
}
