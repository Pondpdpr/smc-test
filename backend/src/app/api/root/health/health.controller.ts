import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

import { UsePublic } from '@/infra/middleware/jwt/jwt.common';
import { toHttpSuccess } from '@/shared/http/http.mapper';

import { GetHealthResponse } from './get-health/get-healths.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memIndicator: MemoryHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @UsePublic()
  async getHealth(): Promise<GetHealthResponse> {
    // const data = await this.health.check([
    //   () => this.memIndicator.checkHeap('heap', appConfig.memThreshold),
    //   () => this.memIndicator.checkRSS('rss', appConfig.memThreshold),
    //   () => this.db.pingCheck('database'),
    // ]);

    const data = await this.health.check([]);

    return toHttpSuccess({
      data: {
        status: data.status,
      },
    });
  }
}
