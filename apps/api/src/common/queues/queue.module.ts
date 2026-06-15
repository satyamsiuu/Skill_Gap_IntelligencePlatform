/**
 * SGIP — Queue Module
 * Ticket: SGIP-1.1.3.2
 *
 * Registers all 4 SGIP BullMQ queues (Document 2 §7.2) in both
 * the API application and the Worker application.
 *
 * Queues are registered here so they can be injected into any feature module
 * that needs to enqueue jobs. Actual processor registration happens in each
 * feature module's worker sub-module (e.g., DocumentsWorkerModule).
 */
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './queue.constants';
import { QueueHealthService } from './queue-health.service';

@Module({
  imports: [
    // Register all 4 canonical queues (Document 2 §7.2)
    BullModule.registerQueue(
      { name: QUEUE_NAMES.DOCUMENTS },
      { name: QUEUE_NAMES.NORMALIZATION },
      { name: QUEUE_NAMES.SCORING },
      { name: QUEUE_NAMES.ROADMAP },
    ),
  ],
  providers: [QueueHealthService],
  exports: [
    BullModule, // Re-export so feature modules can inject queue tokens
    QueueHealthService,
  ],
})
export class QueueModule {}
