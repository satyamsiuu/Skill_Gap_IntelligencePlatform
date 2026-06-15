/**
 * SGIP — Logging Configuration
 * Ticket: SGIP-1.3.1.1
 *
 * Structured JSON logging via nestjs-pino + pino-http.
 * Every log line carries:
 *   - correlationId (from X-Correlation-ID header or auto-generated)
 *   - requestId     (pino-http auto-generated per-request)
 *   - userId        (set in CorrelationInterceptor after JWT is verified)
 *   - level         (trace/debug/info/warn/error)
 *   - timestamp     (ISO 8601)
 *   - context       (NestJS Logger context name)
 *   - msg           (log message)
 *
 * In development: pino-pretty formats output for human readability.
 * In production:  raw JSON (stdout) for ingestion by CloudWatch/Datadog/Loki.
 *
 * NEVER log: passwords, JWT tokens, raw refresh token values, PII fields
 * beyond userId. Enforceable at the redact layer below.
 *
 * Usage:
 *   private readonly logger = new Logger(MyService.name);
 *   this.logger.log('Processing job', { jobId, candidateId });
 *   this.logger.error('Failed to embed skill', { skillId, error: e.message });
 */
import type { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

export const pinoLoggerConfig: Params = {
  pinoHttp: {
    // ── Log level ────────────────────────────────────────────────────────────
    level: isProduction ? 'info' : 'debug',

    // ── Transport ────────────────────────────────────────────────────────────
    // pino-pretty in dev; raw JSON in production
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
            messageFormat: '[{context}] {msg}',
          },
        },

    // ── Correlation ID propagation ────────────────────────────────────────
    // Reads X-Correlation-ID from inbound request header.
    // If absent, pino-http has already generated a reqId — we use that.
    customProps: (req) => ({
      correlationId:
        (req.headers as Record<string, string>)['x-correlation-id'] ??
        undefined,
      // userId is added later by CorrelationInterceptor after auth
    }),

    // ── Serializers ──────────────────────────────────────────────────────
    // Restrict request/response logging to safe fields only.
    serializers: {
      req(req: {
        id: string;
        method: string;
        url: string;
        headers: Record<string, string>;
        remoteAddress: string;
      }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          // Log Authorization header type only (not the token value)
          authType: req.headers.authorization
            ? req.headers.authorization.split(' ')[0]
            : undefined,
        };
      },
      res(res: { statusCode: number }) {
        return {
          statusCode: res.statusCode,
        };
      },
    },

    // ── PII / Secret redaction ────────────────────────────────────────────
    // These paths are redacted from ALL log output, including debug.
    // Add any new PII-adjacent fields discovered during implementation.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
        'req.body.token',
        'req.body.refreshToken',
        '*.password',
        '*.passwordHash',
        '*.tokenHash',
        '*.apiKey',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },

    // ── Auto-log level by status code ────────────────────────────────────
    customLogLevel: (_req, res, err) => {
      if (err) return 'error';
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    // ── Success/error message format ─────────────────────────────────────
    customSuccessMessage: (req, res) =>
      `${(req as { method: string }).method} ${(req as { url: string }).url} → ${res.statusCode}`,

    customErrorMessage: (req, _res, err) =>
      `${(req as { method: string }).method} ${(req as { url: string }).url} failed: ${err.message}`,

    // ── Quiet health checks (avoid log spam) ──────────────────────────────
    // /health is polled every 30s by load balancers — exclude from request logs
    autoLogging: {
      ignore: (req) => (req as { url: string }).url === '/api/v1/health',
    },
  },
};
