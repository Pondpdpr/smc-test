import type { FileExposeType } from '@/infra/db/db';
import { getFileExtension } from '@/shared/common/common.buffer';
import myDayjs from '@/shared/common/common.dayjs';
import { $pgState, getPgState } from '@/shared/common/common.domain';
import { valueOr } from '@/shared/common/common.func';

import {
  STORED_FILE_PUBLIC_STORAGE_KEY_PREFIX,
  STORED_FILE_STORAGE_KEY_PREFIX,
} from './stored-file.constant';
import type {
  StoredFile,
  StoredFileNewData,
  StoredFileUpdateData,
} from './stored-file.domain';

export function getStoredFileKey(opts: {
  id: string;
  ownerTable: string;
  fileExposeType: FileExposeType;
}): string {
  const folder =
    opts.fileExposeType === 'PUBLIC'
      ? STORED_FILE_PUBLIC_STORAGE_KEY_PREFIX
      : STORED_FILE_STORAGE_KEY_PREFIX;

  return `${folder}/${opts.ownerTable}/${opts.id}`;
}

export function newStoredFile(data: StoredFileNewData): StoredFile {
  return {
    id: data.id,
    refName: valueOr(data.refName, 'DEFAULT'),
    ownerTable: data.ownerTable,
    ownerId: data.ownerId,
    filename: data.filename,
    filesizeByte: valueOr(data.filesizeByte, 0),
    storageName: valueOr(data.storageName, 's3'),
    fileExposeType: valueOr(data.fileExposeType, 'PRESIGN'),
    createdAt: new Date(),
    updatedAt: new Date(),
    extension: getFileExtension(data.filename),
    checksum: null,
    expireAt: data.expireAt || null,
    keyPath: getStoredFileKey({
      id: data.id,
      ownerTable: data.ownerTable,
      fileExposeType: valueOr(data.fileExposeType, 'PRESIGN'),
    }),
    presignUrl: null,
    mimeType: null,
  };
}

export function newStoredFiles(data: StoredFileNewData[]): StoredFile[] {
  return data.map((d) => newStoredFile(d));
}

export function isStoredFileChanged(entity: StoredFile): boolean {
  return entity.keyPath !== getPgState(entity)?.key_path;
}

export function editStoredFile(
  entity: StoredFile,
  data: StoredFileUpdateData,
): StoredFile {
  return {
    [$pgState]: getPgState(entity),
    id: valueOr(data.id, entity.id),
    refName: valueOr(data.refName, entity.refName),
    ownerTable: entity.ownerTable,
    storageName: entity.storageName,
    createdAt: entity.createdAt,
    checksum: entity.checksum,
    presignUrl: entity.presignUrl,
    mimeType: entity.mimeType,
    filesizeByte: valueOr(data.filesizeByte, entity.filesizeByte),

    // Update
    keyPath: getStoredFileKey({
      id: valueOr(data.id, entity.id),
      ownerTable: entity.ownerTable,
      fileExposeType: valueOr(data.fileExposeType, entity.fileExposeType),
    }),
    ownerId: valueOr(data.ownerId, entity.ownerId),
    filename: valueOr(data.filename, entity.filename),
    extension: data.filename
      ? getFileExtension(data.filename)
      : entity.extension,
    fileExposeType: valueOr(data.fileExposeType, entity.fileExposeType),
    expireAt: valueOr(data.expireAt, entity.expireAt),
    updatedAt: myDayjs().toDate(),
  };
}
