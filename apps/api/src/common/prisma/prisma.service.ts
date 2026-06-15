/**
 * SGIP — Prisma Service
 *
 * Extends PrismaClient with:
 * 1. NestJS lifecycle hook integration (graceful shutdown)
 * 2. Structured logging of slow queries
 *
 * This is the sole entry point to the database throughout the entire application.
 * Do not instantiate PrismaClient directly anywhere else.
 */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log slow queries in development for performance awareness
    if (process.env.NODE_ENV !== 'production') {
      // Prisma query events — log if duration > 200ms (our NFR threshold)
      (this as any).$on(
        'query',
        (event: { query: string; duration: number }) => {
          if (event.duration > 200) {
            this.logger.warn(
              `⚠️  Slow query detected (${event.duration}ms): ${event.query.slice(0, 200)}`,
            );
          }
        },
      );
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
