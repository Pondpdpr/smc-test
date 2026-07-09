import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { ApiException } from '@/shared/http/http.exception';
import { Read } from '@/shared/type/type.common';

import { REDIS_CLIENT } from './cache.provider';

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private redisClient: Redis,
  ) {}

  async onModuleDestroy() {
    if (this._isEnable()) {
      await this.redisClient.quit();
    }
  }

  async get(key: string): Promise<string | null>;
  async get<T>(key: string): Promise<T | null>;
  async get<T>(key: string): Promise<string | T | null> {
    if (!this._isEnable()) {
      return null;
    }

    try {
      const val = await this.redisClient.get(key);
      if (!val) {
        return null;
      }

      const parsedObj = JSON.parse(val);
      return parsedObj;
    } catch (error) {
      throw new ApiException(500, 'failedGettingKey', { error });
    }
  }

  async set(
    key: string,
    data: string | Read<Record<string, any>> | number,
    ttlInSeconds = 3600,
  ): Promise<void> {
    if (!this._isEnable()) {
      return;
    }

    try {
      await this.redisClient.set(key, JSON.stringify(data), 'EX', ttlInSeconds);
    } catch (error) {
      throw new ApiException(500, 'failedSettingKey', { error });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this._isEnable()) {
      return;
    }

    try {
      await this.redisClient.del(key);
      return;
    } catch (error) {
      throw new ApiException(500, 'failedDeletingKey', { error });
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this._isEnable()) {
      return false;
    }

    try {
      const exists = await this.redisClient.exists(key);
      return exists > 0;
    } catch {
      return false;
    }
  }

  private _isEnable() {
    return this.redisClient.status === 'ready';
  }
}
