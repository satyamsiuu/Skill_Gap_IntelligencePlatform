/**
 * SGIP — BullMQ Worker Process Bootstrap
 *
 * This is the separate worker process entrypoint (Document 2, Section 1).
 * It shares the same codebase as the API but boots with WorkerModule instead of AppModule,
 * connecting to the same NestJS module providers (Prisma, Redis, etc.) without
 * starting the HTTP server.
 *
 * Why a separate process? Worker processes handle long-running, resource-intensive
 * AI tasks (resume parsing, embedding computation). Isolating them prevents a slow
 * AI job from affecting API response times, and allows independent scaling (Document 2, Section 15.3).
 *
 * IMPORTANT: The local embedding model (EmbeddingService) loads here, not in the API.
 * Worker startup takes longer than the API due to model loading (~3–10s depending on model size).
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './workers/worker.module';

async function bootstrapWorker() {
  const logger = new Logger('Worker');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Workers don't serve HTTP — they listen on BullMQ queues.
  // The NestJS application context starts all registered processors automatically.
  logger.log('SGIP Worker process started');
  logger.log('Listening on queues: documents, normalization, roadmap, scoring');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Gracefully shutting down worker...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

bootstrapWorker().catch((err) => {
  console.error('Fatal error during worker bootstrap:', err);
  process.exit(1);
});
