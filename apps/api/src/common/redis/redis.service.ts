/**
 * SGIP — Redis Service
 * Ticket: SGIP-1.1.3.1
 *
 * Provides a shared ioredis client for:
 * - BullMQ queue connections (via @nestjs/bullmq — uses separate connections internally)
 * - Health checks (this service's ping())
 * - Future: ephemeral caching (Document 2, Section 8.2)
 * - Future: AI response cache (SGIP-7.1.1.4)
 *
 * NOTE: BullMQ manages its OWN Redis connections via @nestjs/bullmq/BullModule.forRootAsync.
 * This service provides a separate, lightweight client specifically for health checks
 * and application-level caching. Do not use this client for queue operations.
 *
 * The Redis connection is configured from environment variables (Document 2 §11):
 * REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TLS
 */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RedisHealthStatus {
  status: 'ok' | 'degraded';
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      tls: this.config.get<boolean>('REDIS_TLS', false) ? {} : undefined,
      // Disable auto-reconnect during health checks to fail fast
      enableOfflineQueue: false,
      // Connection timeout — fail health check if Redis is unreachable
      connectTimeout: 2000,
      lazyConnect: true, // Don't connect until first use
    });

    this.client.on('error', (err: Error) => {
      this.logger.error('Redis client error', err.message);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting...');
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Returns the raw Redis client for use by cache services.
   * Do NOT use for BullMQ queue operations — BullMQ has its own connections.
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Pings Redis and returns health status with latency.
   * Called by the /health endpoint (SGIP-1.1.3.1 AC).
   */
  async checkHealth(): Promise<RedisHealthStatus> {
    const start = Date.now();
    try {
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      const pong = await this.client.ping();
      const latencyMs = Date.now() - start;

      if (pong !== 'PONG') {
        return {
          status: 'degraded',
          latencyMs,
          error: `Unexpected ping response: ${pong as string}`,
        };
      }

      return { status: 'ok', latencyMs };
    } catch (error) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  /**
   * Simple get/set wrappers for application-level caching.
   * TTL is in seconds.
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
