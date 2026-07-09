import type { HealthCheckStatus } from '@nestjs/terminus';

import { IStandardResponse } from '@/shared/type/type.http';

export type GetHealthResponse = IStandardResponse<{
  status: HealthCheckStatus;
}>;
