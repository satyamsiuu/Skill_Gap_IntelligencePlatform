/**
 * SGIP — Queue Health Service
 * Ticket: SGIP-1.1.3.2
 *
 * Provides health status for all BullMQ queues.
 * Used by the /health endpoint to report queue connectivity.
 *
 * Also provides a test job enqueuing method used in SGIP-1.1.3.2 AC validation:
 * "A test job enqueued from the API is observably processed by the worker."
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from './queue.constants';

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  isPaused: boolean;
}

@Injectable()
export class QueueHealthService {
  private readonly logger = new Logger(QueueHealthService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.DOCUMENTS) private readonly documentsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NORMALIZATION)
    private readonly normalizationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SCORING) private readonly scoringQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ROADMAP) private readonly roadmapQueue: Queue,
  ) {}

  /**
   * Returns counts for all queues.
   * Used for admin dashboard and /health endpoint (SGIP-1.1.3.2 AC).
   */
  async getQueueStatuses(): Promise<QueueStatus[]> {
    const queues = [
      { name: QUEUE_NAMES.DOCUMENTS, queue: this.documentsQueue },
      { name: QUEUE_NAMES.NORMALIZATION, queue: this.normalizationQueue },
      { name: QUEUE_NAMES.SCORING, queue: this.scoringQueue },
      { name: QUEUE_NAMES.ROADMAP, queue: this.roadmapQueue },
    ];

    const statuses = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed, isPaused] =
          await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
            queue.isPaused(),
          ]);
        return { name, waiting, active, completed, failed, delayed, isPaused };
      }),
    );

    return statuses;
  }

  /**
   * Enqueue a test/diagnostic job.
   * Used in SGIP-1.1.3.2 acceptance criteria validation.
   *
   * IMPORTANT: This is for diagnostics only. It should not be exposed via any
   * production API endpoint. It is used by the /health endpoint exclusively.
   */
  async enqueueHealthCheckJob(): Promise<string> {
    const job = await this.scoringQueue.add(
      JOB_NAMES.SCORING.RECALCULATE,
      { __healthCheck: true, timestamp: Date.now() },
      {
        // Health check jobs should not retry and should be cleaned up quickly
        attempts: 1,
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.debug(`Health check job enqueued: ${job.id}`);
    return job.id ?? 'unknown';
  }
}
