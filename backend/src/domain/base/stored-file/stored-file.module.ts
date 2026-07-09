import { Module } from '@nestjs/common';

import { StoredFileService } from './stored-file.service';

@Module({
  providers: [StoredFileService, StoredFileService],
  exports: [StoredFileService],
})
export class StoredFileModule {}
