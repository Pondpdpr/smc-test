import { FileExposeType } from '@/infra/db/db';

export type GetPresignUploadUrlOpts = {
  ownerTable: string;
  fileExposeType: FileExposeType;
};
