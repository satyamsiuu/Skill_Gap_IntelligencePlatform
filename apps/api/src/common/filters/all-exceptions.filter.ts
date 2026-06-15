/**
 * SGIP — Global Exception Filter
 *
 * Catches ALL exceptions and returns the standard error envelope:
 * { error: { code, message, fieldErrors? } }
 *
 * Behavior by exception type:
 * - HttpException (including ValidationPipe errors): returns the HTTP status and
 *   the standard error envelope with field-level validation errors if present.
 * - All other exceptions: logs the full error with correlation ID, returns generic 500.
 *   NEVER leaks stack traces to clients in any environment.
 *
 * Document 3, Section 8.3 requirement: All thrown HttpExceptions produce
 * the standard error envelope.
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '@sgip/shared';
import { CORRELATION_ID_HEADER } from '../interceptors/correlation.interceptor';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        error = {
          code: this.statusToCode(status),
          message: exceptionResponse,
        };
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;

        // NestJS ValidationPipe produces { message: string[], error: string, statusCode: number }
        if (Array.isArray(resp.message)) {
          const fieldErrors = this.parseValidationErrors(
            resp.message as string[],
          );
          error = {
            code: 'VALIDATION_ERROR',
            message:
              'Request validation failed. Please check the highlighted fields.',
            fieldErrors,
          };
        } else {
          error = {
            code: this.statusToCode(status),
            message: (resp.message as string) ?? exception.message,
          };
        }
      }
    } else {
      // Unexpected error — log with correlation ID, never expose to client
      this.logger.error(
        `[${correlationId}] Unhandled exception: ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
    }

    response.status(status).json({
      error,
      meta: {
        correlationId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  /**
   * Converts NestJS ValidationPipe's flat error messages into FieldError objects.
   * Format: "fieldName must be X"
   */
  private parseValidationErrors(messages: string[]) {
    return messages.map((msg) => {
      const parts = msg.split(' ');
      return {
        field: parts[0] ?? 'unknown',
        message: msg,
      };
    });
  }

  private statusToCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codes[status] ?? 'ERROR';
  }
}
