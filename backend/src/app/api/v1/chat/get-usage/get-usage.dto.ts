import { IStandardResponse } from '@/shared/type/type.http';

export type GetUsageResponse = IStandardResponse<{
  spendUsd: number;
  limitUsd: number;
  resetAt: string;
}>;
