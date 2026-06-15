/**
 * SGIP — Health Check Controller
 * Ticket: SGIP-1.1.3.1 (Redis health), SGIP-1.1.1.1 (initial)
 *
 * Provides GET /health — used by:
 * - Load balancer health checks
 * - Kubernetes readiness/liveness probes
 * - CI smoke tests after deploy
 *
 * Returns:
 * - status: 'ok' | 'degraded' | 'down'
 * - Individual component statuses (DB, Redis)
 * - Uptime, version, timestamp
 *
 * This is @Public() — no authentication required.
 * IMPORTANT: This endpoint must ALWAYS return HTTP 200, even when degraded.
 * Only return 503 when the service is completely unable to handle requests.
 */
import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RedisService, RedisHealthStatus } from './common/redis/redis.service';
import { PrismaService } from './common/prisma/prisma.service';

type ComponentStatus = 'ok' | 'degraded' | 'unavailable';

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    database: {
      status: ComponentStatus;
      latencyMs?: number;
      error?: string;
    };
    redis: RedisHealthStatus;
  };
}

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'API health check',
    description:
      'Returns connectivity status for DB and Redis. Always returns HTTP 200; check the status field for degraded state.',
  })
  async getHealth(): Promise<HealthCheckResponse> {
    // Run all health checks in parallel for minimal latency
    const [redisHealth, dbHealth] = await Promise.allSettled([
      this.redis.checkHealth(),
      this.checkDatabaseHealth(),
    ]);

    const redisStatus: RedisHealthStatus =
      redisHealth.status === 'fulfilled'
        ? redisHealth.value
        : { status: 'degraded', error: 'Health check threw an exception' };

    const dbStatus =
      dbHealth.status === 'fulfilled'
        ? dbHealth.value
        : {
            status: 'unavailable' as ComponentStatus,
            error: 'Health check threw an exception',
          };

    // Determine overall status
    const allOk = redisStatus.status === 'ok' && dbStatus.status === 'ok';
    const allDown =
      redisStatus.status === 'degraded' && dbStatus.status === 'unavailable';

    return {
      status: allOk ? 'ok' : allDown ? 'down' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: Math.floor(process.uptime()),
      components: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  private async checkDatabaseHealth(): Promise<{
    status: ComponentStatus;
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      // Use a simple SELECT 1 — fast, no table scanning
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unavailable',
        latencyMs: Date.now() - start,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
