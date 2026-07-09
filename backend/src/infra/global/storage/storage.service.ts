import {
  _Object,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lookup as mimeLookup } from 'mime-types';
import { Readable } from 'stream';

import { AppConfig } from '@/infra/config';
import myDayjs from '@/shared/common/common.dayjs';
import { ApiException } from '@/shared/http/http.exception';
import { DayjsDuration } from '@/shared/type/type.common';

import { LoggerService } from '../logger/logger.service';
import { S3_STORAGE } from './storage.provider';
import { StorageOptions } from './storage.type';

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  defaultBucket: string;
  enable: boolean;

  constructor(
    @Inject(S3_STORAGE)
    private s3: S3Client,
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  onModuleDestroy() {
    this.s3?.destroy();
  }

  async onModuleInit() {
    const storageConfig =
      this.configService.getOrThrow<AppConfig['storage']>('storage');

    this.defaultBucket = storageConfig.defaultBucket;
    this.enable = storageConfig.enable;

    await this._ensureBucket(this.defaultBucket);
  }

  async put(file: Express.Multer.File, key: string, opts?: StorageOptions) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: opts?.bucket || this.defaultBucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'uploadFail');
    }
  }

  async putBuffer(buffer: Buffer, key: string, opts?: StorageOptions) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    const contentType = mimeLookup(key) || 'application/octet-stream';

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: opts?.bucket || this.defaultBucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'uploadFail');
    }
  }

  async get(key: string, opts?: StorageOptions) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    try {
      const res = await this.s3.send(
        new GetObjectCommand({
          Bucket: opts?.bucket || this.defaultBucket,
          Key: key,
        }),
      );

      return res.Body as Readable;
    } catch (e: any) {
      this.loggerService.error(e);
      return null;
    }
  }

  async getPresigned(
    key: string,
    opts?: StorageOptions & { expiresIn?: DayjsDuration },
  ) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    const expiresIn = opts?.expiresIn
      ? myDayjs.duration(opts.expiresIn).asSeconds()
      : myDayjs.duration({ hours: 1 }).asSeconds(); // default 1 hour

    try {
      const command = new GetObjectCommand({
        Bucket: opts?.bucket || this.defaultBucket,
        Key: key,
      });

      const presigned = await getSignedUrl(this.s3, command, { expiresIn });

      return presigned;
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'getPresignFail');
    }
  }

  async createUploadPresign(
    key: string,
    opts?: StorageOptions & { expiresIn?: DayjsDuration; mimetype?: string },
  ) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    const command = new PutObjectCommand({
      Bucket: opts?.bucket || this.defaultBucket,
      Key: key,
      ContentType: opts?.mimetype,
    });

    const expiresIn = opts?.expiresIn
      ? myDayjs.duration(opts.expiresIn).asSeconds()
      : myDayjs.duration({ hours: 1 }).asSeconds();

    try {
      const url = await getSignedUrl(this.s3, command, {
        expiresIn: expiresIn,
      });

      return url;
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'getPresignFail');
    }
  }

  async getObjectMeta(key: string, opts?: StorageOptions) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: opts?.bucket || this.defaultBucket,
        Key: key,
      });
      const res = await this.s3.send(command);

      return {
        mimetype: res.ContentType ?? null,
        sizeBytes: res.ContentLength ?? null,
        checksum:
          res.ChecksumSHA256 ??
          res.ChecksumSHA1 ??
          res.ChecksumCRC32 ??
          res.ChecksumCRC32C ??
          // fallback to ETag (not a true checksum but often used)
          res.ETag?.replace(/"/g, '') ??
          null,
      };
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(400, 'invalidKey');
    }
  }

  async remove(key: string, opts?: StorageOptions) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: opts?.bucket || this.defaultBucket,
          Key: key,
        }),
      );
    } catch (e: any) {
      this.loggerService.error(e);
      return;
    }
  }

  async exists(key: string, opts?: StorageOptions): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: opts?.bucket || this.defaultBucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(key: string, opts?: StorageOptions): Promise<void> {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: opts?.bucket || this.defaultBucket,
          Key: key,
        }),
      );
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'deleteFail');
    }
  }

  async deleteFolder(prefix: string, opts?: StorageOptions): Promise<void> {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    const bucket = opts?.bucket || this.defaultBucket;
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    try {
      let continuationToken: string | undefined;

      do {
        const res = await this.s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: normalizedPrefix,
            ContinuationToken: continuationToken,
          }),
        );

        const objects = res.Contents?.map((o) => ({ Key: o.Key! })) ?? [];

        if (objects.length > 0) {
          await this.s3.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: objects,
                Quiet: true,
              },
            }),
          );
        }

        continuationToken = res.NextContinuationToken;
      } while (continuationToken);
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'deleteFolderFail');
    }
  }

  async list(
    opts?: StorageOptions & { prefix?: string; continuationToken?: string },
  ): Promise<{ content: _Object[]; continuationToken?: string }> {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    try {
      const res = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: opts?.bucket || this.defaultBucket,
          Prefix: opts?.prefix || '',
          ContinuationToken: opts?.continuationToken,
        }),
      );
      return {
        content: res.Contents ?? [],
        continuationToken: res.NextContinuationToken,
      };
    } catch (e: any) {
      this.loggerService.error(e);
      return { content: [] };
    }
  }

  async copy(fromKey: string, toKey: string, opts?: StorageOptions) {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    const bucket = opts?.bucket || this.defaultBucket;

    try {
      await this.s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${fromKey}`,
          Key: toKey,
        }),
      );
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'copyFail');
    }
  }

  async ensureFile(
    key: string,
    opts?: StorageOptions & { initialContent?: Buffer | string },
  ): Promise<void> {
    if (!this.enable) {
      throw new ApiException(500, 'storageDisable');
    }

    const bucket = opts?.bucket || this.defaultBucket;

    const exists = await this.exists(key, { bucket });
    if (exists) return;

    const body =
      opts?.initialContent instanceof Buffer
        ? opts.initialContent
        : Buffer.from(opts?.initialContent ?? '');

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: 'application/octet-stream',
        }),
      );
    } catch (e: any) {
      this.loggerService.error(e);
      throw new ApiException(502, 'fileCreateFail');
    }
  }

  private async _ensureBucket(bucket: string): Promise<void> {
    if (!this.enable) {
      return;
    }

    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (e: any) {
      // 409 is already owned we ignore
      if (e?.$metadata?.httpStatusCode !== 409) {
        throw new ApiException(502, 'bucketCreateFail');
      }
    }
  }
}
