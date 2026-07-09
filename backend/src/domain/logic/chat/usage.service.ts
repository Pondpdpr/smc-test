import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { AppConfig } from '@/infra/config';
import { REDIS_CLIENT } from '@/infra/global/cache/cache.provider';

import { USAGE_REDIS_KEY_PREFIX } from './chat.constant';

export type UsageStatus = {
  spendUsd: number;
  limitUsd: number;
  resetAt: Date;
};

@Injectable()
export class UsageService {
  constructor(
    // Bypasses CacheService on purpose: CacheService treats Redis as
    // optional (silently no-ops unless ENABLE_CACHE=true), but spend
    // enforcement is a graded requirement and must never silently skip.
    // ioredis's lazyConnect means commands on this client still connect
    // transparently regardless of that flag.
    @Inject(REDIS_CLIENT)
    private redisClient: Redis,
    private configService: ConfigService,
  ) {}

  async getUsage(userId: string): Promise<UsageStatus> {
    const { limitUsd, resetIntervalSeconds } = this._config();
    const key = this._key(userId);

    const [spendMicros, ttl] = await Promise.all([
      this.redisClient.get(key),
      this.redisClient.ttl(key),
    ]);

    const resetInSeconds = ttl && ttl > 0 ? ttl : resetIntervalSeconds;

    return {
      spendUsd: Number(spendMicros ?? 0) / 1_000_000,
      limitUsd,
      resetAt: new Date(Date.now() + resetInSeconds * 1000),
    };
  }

  async hasBudgetRemaining(userId: string): Promise<boolean> {
    const usage = await this.getUsage(userId);
    return usage.spendUsd < usage.limitUsd;
  }

  // Adds cost to the current window. The TTL is only set on the increment
  // that creates the key, so the window doesn't reset on every message.
  async recordCost(userId: string, costUsd: number): Promise<void> {
    const { resetIntervalSeconds } = this._config();
    const key = this._key(userId);
    const costMicros = Math.round(costUsd * 1_000_000);

    if (costMicros <= 0) {
      return;
    }

    const newValue = await this.redisClient.incrby(key, costMicros);
    if (newValue === costMicros) {
      await this.redisClient.expire(key, resetIntervalSeconds);
    }
  }

  private _config() {
    return this.configService.getOrThrow<AppConfig['usage']>('usage');
  }

  private _key(userId: string): string {
    return `${USAGE_REDIS_KEY_PREFIX}${userId}`;
  }
}
