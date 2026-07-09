import { S3Client } from '@aws-sdk/client-s3';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '@/infra/config';

export const S3_STORAGE = Symbol('S3_STORAGE');

export const StorageProvider: Provider = {
  provide: S3_STORAGE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const storageConfig =
      configService.getOrThrow<AppConfig['storage']>('storage');

    if (!storageConfig.enable) {
      return null;
    }

    const hasCredential =
      !!storageConfig.accessKey && !!storageConfig.secretKey;

    const s3 = new S3Client({
      region: storageConfig.region,
      endpoint: storageConfig.endpoint,
      forcePathStyle: storageConfig.enableForcePath,
      credentials: hasCredential
        ? {
            accessKeyId: storageConfig.accessKey!,
            secretAccessKey: storageConfig.secretKey!,
          }
        : undefined,
    });

    return s3;
  },
};
