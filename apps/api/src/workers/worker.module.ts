/**
 * SGIP — Worker Module
 * Ticket: SGIP-1.1.3.2
 *
 * Root module for the separate worker process (main-worker.ts).
 * This module does NOT import AppModule — it's a separate root module.
 * It shares the same provider implementations but is optimized for
 * background processing (no HTTP server, no guards/filters/interceptors).
 *
 * Queue names (Document 2 §7.2):
 * - sgip.documents  → resume parsing, antivirus scanning
 * - sgip.normalization → skill/role embedding generation
 * - sgip.scoring    → readiness score recalculation
 * - sgip.roadmap    → AI roadmap enrichment
 *
 * Adding a new processor:
 * 1. Create a processor class decorated with @Processor('sgip.<queue-name>')
 * 2. Add it to the appropriate feature worker module (e.g., DocumentsWorkerModule)
 * 3. Import that module here
 * 4. All processors must use upsert patterns (ADR-016 — idempotent job processing)
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../common/prisma/prisma.module';
import { QueueModule } from '../common/queues/queue.module';
import { appConfig, validateConfig } from '../common/config/app.config';
import { QUEUE_NAMES } from '../common/queues/queue.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          tls: config.get<boolean>('REDIS_TLS', false) ? {} : undefined,
        },
        // Default job options for all queues
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // 2s → 4s → 8s
          },
          removeOnComplete: 100, // Keep last 100 completed jobs for debugging
          removeOnFail: 500, // Keep last 500 failed jobs for analysis
        },
      }),
    }),

    // Register all queues so processors can inject them
    BullModule.registerQueue(
      { name: QUEUE_NAMES.DOCUMENTS },
      { name: QUEUE_NAMES.NORMALIZATION },
      { name: QUEUE_NAMES.SCORING },
      { name: QUEUE_NAMES.ROADMAP },
    ),

    PrismaModule,
    QueueModule,

    // Feature processor modules (uncommented as processors are implemented):
    // - DocumentsWorkerModule (SGIP-7.2.1.1, SGIP-7.2.1.2)
    // - NormalizationWorkerModule (SGIP-4.1.2.1, SGIP-4.1.2.2)
    // - ScoringWorkerModule (SGIP-6.2.1.3, SGIP-6.2.1.4)
    // - RoadmapWorkerModule (SGIP-7.2.3.1)
  ],
  providers: [],
})
export class WorkerModule {}
