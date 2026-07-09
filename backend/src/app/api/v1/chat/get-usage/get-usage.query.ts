import { Injectable } from '@nestjs/common';

import { UsageService } from '@/domain/logic/chat/usage.service';
import { toHttpSuccess } from '@/shared/http/http.mapper';
import { QueryInterface } from '@/shared/type/type.common';

import { GetUsageResponse } from './get-usage.dto';

@Injectable()
export class GetUsageQuery implements QueryInterface {
  constructor(private usageService: UsageService) {}

  async exec(userId: string): Promise<GetUsageResponse> {
    const usage = await this.getRaw(userId);

    return toHttpSuccess({
      data: {
        spendUsd: usage.spendUsd,
        limitUsd: usage.limitUsd,
        resetAt: usage.resetAt.toISOString(),
      },
    });
  }

  async getRaw(userId: string) {
    return this.usageService.getUsage(userId);
  }
}
