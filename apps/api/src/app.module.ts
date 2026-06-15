/**
 * SGIP — Root Application Module
 *
 * Registers all feature modules, global config, Prisma, Redis/BullMQ,
 * and cross-cutting infrastructure (auth, rate limiting, throttling).
 *
 * Module registration order follows the dependency graph in IMPLEMENTATION_STRATEGY.md.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// ── Common / Infrastructure ──────────────────────────────────────────────────
import { CommonModule } from './common/common.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queues/queue.module';
import { AuditModule } from './audit/audit.module';
import { LoggerModule } from 'nestjs-pino';
import { pinoLoggerConfig } from './common/logger/logger.config';

// ── Feature Modules (Document 2, Section 6.1) ───────────────────────────────
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SkillsModule } from './skills/skills.module';
import { RolesModule } from './roles/roles.module';
import { NormalizationModule } from './normalization/normalization.module';
import { ScoringModule } from './scoring/scoring.module';
import { DocumentsModule } from './documents/documents.module';
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';

// ── Guards & Filters (Global) ───────────────────────────────────────────────
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CorrelationInterceptor } from './common/interceptors/correlation.interceptor';
import { AppController } from './app.controller';

// ── Config validation ────────────────────────────────────────────────────────
import { appConfig, validateConfig } from './common/config/app.config';

@Module({
  imports: [
    // ── Configuration (must be first — all other modules depend on env vars) ──
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ── Rate Limiting (Document 3, Section 8.2) ──────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // General API rate limit
          ttl: config.get<number>('THROTTLE_TTL_MS', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ── BullMQ (Document 2, Section 7.2) ─────────────────────────────────────
    // Queues: documents, normalization, roadmap, scoring (per Document 2 §7.2 table)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
          tls: config.get<boolean>('REDIS_TLS', false) ? {} : undefined,
        },
      }),
    }),

    // ── Infrastructure ────────────────────────────────────────────────────────
    LoggerModule.forRoot(pinoLoggerConfig),
    CommonModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    AuditModule,

    // ── Feature Modules ───────────────────────────────────────────────────────
    // Order follows dependency graph — each module's dependencies are registered above it.
    AuthModule,
    UsersModule,
    ProfilesModule,
    SkillsModule,
    RolesModule,
    NormalizationModule,
    ScoringModule,
    DocumentsModule,
    AiGatewayModule,
    AdminModule,
    NotificationsModule,
  ],

  providers: [
    // ── Global Guards ─────────────────────────────────────────────────────────
    // JwtAuthGuard is global — all routes require authentication by default.
    // Use @Public() decorator to opt out for auth endpoints (login, register, etc.)
    // This is the mechanism that enforces the Auth Law (ADR-006, Document 3 §2.1).
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // RolesGuard enforces @Roles() decorator. Works alongside JwtAuthGuard.
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // ── Global Filters ────────────────────────────────────────────────────────
    // Catches all unhandled exceptions and returns the standard error envelope.
    // Never leaks stack traces to clients in production.
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // ── Global Interceptors ───────────────────────────────────────────────────
    // Generates/propagates a correlation ID for every request.
    // Document 2 §11 requires correlation IDs in all logs.
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationInterceptor,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
