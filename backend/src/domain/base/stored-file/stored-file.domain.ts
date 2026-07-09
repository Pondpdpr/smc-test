import type { FileExposeType, StoredFiles } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

import type { STORED_FILE_OWNER_TABLE } from './stored-file.constant';

type StoredFilePlain = {
  readonly id: string;
  readonly refName: string;
  keyPath: string;
  readonly ownerTable: string;
  ownerId: string;
  filename: string;
  filesizeByte: number;
  readonly storageName: string;
  fileExposeType: FileExposeType;
  readonly createdAt: Date;
  updatedAt: Date;
  extension: string;
  checksum: string | null;
  presignUrl: string | null;
  expireAt: Date | null;
  mimeType: string | null;
};

export type StoredFilePg = DBModel<StoredFiles>;
export type StoredFile = WithState<StoredFilePg> & StoredFilePlain;
export type StoredFileJson = WithState<StoredFilePg> &
  Serialized<StoredFilePlain>;

export type StoredFileResponse = {
  id: string;
  filename: string;
  filesizeByte: number;
  presignUrl: string;
  createdAt: string;
  updatedAt: string;
  mimeType: string;
  extension: string;
};

export type PresignUploadResponse = {
  id: string;
  presignUrl: string;
};

export type StoredFileNewData = {
  id: string;
  ownerTable: STORED_FILE_OWNER_TABLE;
  ownerId: string;
  filename: string;
  filesizeByte?: number;
  refName?: string;
  storageName?: string;
  fileExposeType?: FileExposeType;
  expireAt?: Date;
};

export type StoredFileUpdateData = {
  id?: string;
  filename?: string;
  ownerId?: string;
  refName?: string;
  expireAt?: Date;
  fileExposeType?: FileExposeType;
  filesizeByte?: number;
  keyPath?: string;
};
