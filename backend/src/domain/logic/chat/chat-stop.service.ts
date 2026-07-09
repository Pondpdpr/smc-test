import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@/infra/global/cache/cache.provider';

import {
  CHAT_STOP_FLAG_TTL_SECONDS,
  CHAT_STOP_REDIS_KEY_PREFIX,
} from './chat.constant';

@Injectable()
export class ChatStopService {
  constructor(
    // Same reasoning as UsageService: bypasses CacheService's optional
    // enable flag, since a missed stop request must not silently no-op.
    @Inject(REDIS_CLIENT)
    private redisClient: Redis,
  ) {}

  async requestStop(conversationId: string): Promise<void> {
    await this.redisClient.set(
      this._key(conversationId),
      '1',
      'EX',
      CHAT_STOP_FLAG_TTL_SECONDS,
    );
  }

  async isStopRequested(conversationId: string): Promise<boolean> {
    const exists = await this.redisClient.exists(this._key(conversationId));
    return exists > 0;
  }

  async clearStop(conversationId: string): Promise<void> {
    await this.redisClient.del(this._key(conversationId));
  }

  private _key(conversationId: string): string {
    return `${CHAT_STOP_REDIS_KEY_PREFIX}${conversationId}`;
  }
}
