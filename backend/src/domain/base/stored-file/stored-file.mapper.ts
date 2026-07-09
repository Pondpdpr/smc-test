import {
  $pgState,
  getPgState,
  setPgState,
} from '@/shared/common/common.domain';
import { toDate, toResponseDate } from '@/shared/common/common.transformer';
import { ApiException } from '@/shared/http/http.exception';

import type {
  StoredFileJson,
  StoredFilePg,
  StoredFileResponse,
} from './stored-file.domain';
import { StoredFile } from './stored-file.domain';

export function storedFileFromPg(pg: StoredFilePg): StoredFile {
  const sf: StoredFile = {
    id: pg.id,
    refName: pg.ref_name,
    keyPath: pg.key_path,
    ownerTable: pg.owner_table,
    ownerId: pg.owner_id,
    filename: pg.filename,
    filesizeByte: Number(pg.filesize_byte),
    storageName: pg.storage_name,
    presignUrl: pg.presign_url,
    fileExposeType: pg.file_expose_type,
    createdAt: toDate(pg.created_at),
    updatedAt: toDate(pg.updated_at),
    extension: pg.extension,
    mimeType: pg.mime_type,
    checksum: pg.checksum,
    expireAt: pg.expire_at ? toDate(pg.expire_at) : null,
  };
  return setPgState(sf, pg);
}

export function storedFileFromJson(data: StoredFileJson): StoredFile {
  return {
    id: data.id,
    refName: data.refName,
    keyPath: data.keyPath,
    ownerTable: data.ownerTable,
    ownerId: data.ownerId,
    filename: data.filename,
    filesizeByte: data.filesizeByte,
    storageName: data.storageName,
    presignUrl: data.presignUrl,
    fileExposeType: data.fileExposeType,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    extension: data.extension,
    checksum: data.checksum,
    expireAt: data.expireAt ? toDate(data.expireAt) : null,
    mimeType: data.mimeType,
    [$pgState]: getPgState(data),
  };
}

export function storedFileToPg(storedFile: StoredFile): StoredFilePg {
  if (!storedFile.keyPath) {
    throw new ApiException(500, 'storedFileNoKey');
  }
  if (!storedFile.presignUrl) {
    throw new ApiException(500, 'storedFileNoPresign');
  }

  return {
    id: storedFile.id,
    ref_name: storedFile.refName,
    key_path: storedFile.keyPath,
    owner_table: storedFile.ownerTable,
    owner_id: storedFile.ownerId,
    filename: storedFile.filename,
    filesize_byte: storedFile.filesizeByte.toString(),
    storage_name: storedFile.storageName,
    presign_url: storedFile.presignUrl,
    file_expose_type: storedFile.fileExposeType,
    mime_type: storedFile.mimeType || '',
    created_at: storedFile.createdAt.toISOString(),
    updated_at: storedFile.updatedAt.toISOString(),
    extension: storedFile.extension,
    checksum: storedFile.checksum,
    expire_at: storedFile.expireAt?.toISOString() || null,
  };
}

export function storedFileToResponse(
  storedFile: StoredFile,
): StoredFileResponse {
  return {
    id: storedFile.id,
    filename: storedFile.filename,
    filesizeByte: storedFile.filesizeByte,
    presignUrl:
      storedFile.fileExposeType !== 'PRIVATE'
        ? storedFile.presignUrl || ''
        : '',
    createdAt: storedFile.createdAt.toISOString(),
    updatedAt: storedFile.updatedAt.toISOString(),
    mimeType: storedFile.mimeType || '',
    extension: storedFile.extension,
  };
}

export function storedFilePgToResponse(pg: StoredFilePg): StoredFileResponse {
  return {
    id: pg.id,
    filename: pg.filename,
    filesizeByte: Number(pg.filesize_byte),
    presignUrl: pg.file_expose_type !== 'PRIVATE' ? pg.presign_url : '',
    createdAt: toResponseDate(pg.created_at),
    updatedAt: toResponseDate(pg.updated_at),
    mimeType: pg.mime_type,
    extension: pg.extension,
  };
}

export function storedFileToJson(storedFile: StoredFile): StoredFileJson {
  return {
    mimeType: storedFile.mimeType,
    id: storedFile.id,
    refName: storedFile.refName,
    keyPath: storedFile.keyPath,
    ownerTable: storedFile.ownerTable,
    ownerId: storedFile.ownerId,
    filename: storedFile.filename,
    filesizeByte: storedFile.filesizeByte,
    storageName: storedFile.storageName,
    presignUrl: storedFile.presignUrl,
    fileExposeType: storedFile.fileExposeType,
    createdAt: storedFile.createdAt.toISOString(),
    updatedAt: storedFile.updatedAt.toISOString(),
    extension: storedFile.extension,
    checksum: storedFile.checksum,
    expireAt: storedFile.expireAt ? storedFile.expireAt.toISOString() : null,
    [$pgState]: getPgState(storedFile),
  };
}
