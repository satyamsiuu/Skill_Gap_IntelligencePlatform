/**
 * SGIP — Correlation ID Interceptor
 *
 * Generates or propagates a correlation ID for every HTTP request.
 * The correlation ID appears in:
 * - Response headers (X-Correlation-ID)
 * - All log entries for the request lifecycle
 * - Any jobs enqueued during the request (so API + worker logs are correlated)
 *
 * Document 2, Section 11: "Every log line includes a request/job correlation ID."
 * This interceptor is the mechanism that attaches it to the request context.
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Honor incoming correlation ID from upstream services; generate a new one otherwise
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) ?? uuidv4();

    // Attach to request so downstream guards, services, and filters can read it
    (request as Request & { correlationId: string }).correlationId =
      correlationId;

    // Attach to request headers so it propagates to any jobs enqueued during this request
    request.headers[CORRELATION_ID_HEADER] = correlationId;

    // Include in response headers for client-side debugging
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `[${correlationId}] ${method} ${url} → ${statusCode} (${duration}ms)`,
          );
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `[${correlationId}] ${method} ${url} → ERROR (${duration}ms)`,
          );
        },
      }),
    );
  }
}
