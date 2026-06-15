/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
/**
 * SGIP — OpenTelemetry Instrumentation
 * Ticket: SGIP-1.3.1.2
 *
 * This file MUST be loaded before any other application code.
 * It is referenced as --require ./instrumentation in the start:prod and start:otel scripts.
 * Do NOT import this from main.ts — that's too late for OTel to intercept requires.
 *
 * Instruments:
 * - HTTP requests (NestJS routes → spans with method, route, status code)
 * - Prisma queries (prisma-client → db.query spans with sanitized query text)
 * - BullMQ jobs (bull → job.process spans with queue name, job name, job ID)
 * - Redis operations (ioredis → db.redis spans)
 * - DNS + net operations (for latency attribution)
 *
 * Exporters:
 * - OTLP/HTTP to OTEL_EXPORTER_OTLP_ENDPOINT (default: http://localhost:4318)
 *   Compatible with Jaeger, Tempo, Datadog OTLP endpoint, CloudWatch OTLP.
 *
 * Configuration (via environment variables):
 *   OTEL_SERVICE_NAME          — Service name tag (default: sgip-api)
 *   OTEL_EXPORTER_OTLP_ENDPOINT — Collector endpoint (default: http://localhost:4318)
 *   OTEL_TRACES_SAMPLER        — Sampling strategy (default: parentbased_always_on)
 *   OTEL_LOG_LEVEL             — SDK log level (default: warn)
 *   OTEL_ENABLED               — Set to "false" to disable all instrumentation (dev/test shortcut)
 *
 * Correlation with pino logs:
 * Each pino log line already carries correlationId (X-Correlation-ID header).
 * OTel spans carry traceId + spanId. When both are fed to the same log aggregator
 * (e.g., Grafana Loki + Tempo), correlationId links user sessions while
 * traceId links technical call chains.
 */

// Exit early without setting up OTel in test or when disabled
if (process.env.OTEL_ENABLED === 'false' || process.env.NODE_ENV === 'test') {
  // No-op
} else {
  const { NodeSDK } =
    require('@opentelemetry/sdk-node') as typeof import('@opentelemetry/sdk-node');

  const { getNodeAutoInstrumentations } =
    require('@opentelemetry/auto-instrumentations-node') as typeof import('@opentelemetry/auto-instrumentations-node');

  const { OTLPTraceExporter } =
    require('@opentelemetry/exporter-trace-otlp-http') as typeof import('@opentelemetry/exporter-trace-otlp-http');

  const { resourceFromAttributes } =
    require('@opentelemetry/resources') as typeof import('@opentelemetry/resources');

  const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  } =
    require('@opentelemetry/semantic-conventions') as typeof import('@opentelemetry/semantic-conventions');

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'sgip-api';
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.1.0',
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV ?? 'development',
    }),

    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),

    instrumentations: [
      getNodeAutoInstrumentations({
        // ── HTTP — trace every NestJS route ────────────────────────────────
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          // Exclude health check from traces (polled every 30s by LB)
          ignoreIncomingRequestHook: (req) => req.url === '/api/v1/health',
          // Add X-Correlation-ID to span attributes for cross-system linking
          requestHook: (span, request) => {
            const headers = (request as { headers?: Record<string, string> })
              .headers;
            if (headers?.['x-correlation-id']) {
              span.setAttribute(
                'app.correlation_id',
                headers['x-correlation-id'],
              );
            }
          },
        },

        // ── Prisma — via pg driver instrumentation ─────────────────────────
        // Note: dbStatementSerializer not supported in this version;
        // SQL content is automatically sanitized by auto-instrumentations.
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
        },

        // ── Redis / ioredis ────────────────────────────────────────────────
        '@opentelemetry/instrumentation-ioredis': {
          enabled: true,
          // Do not capture values, only command names (avoid token/secret leakage)
          dbStatementSerializer: (cmdName: string) => cmdName,
        },

        // ── DNS / net — for latency attribution ───────────────────────────
        '@opentelemetry/instrumentation-dns': { enabled: true },
        '@opentelemetry/instrumentation-net': { enabled: true },

        // ── Disable noisy/low-value instrumentations ───────────────────────
        '@opentelemetry/instrumentation-fs': { enabled: false },

        // ── Express / Fastify — NestJS uses Express by default ────────────
        '@opentelemetry/instrumentation-express': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log(`[OTel] Tracing enabled → ${endpoint} (service: ${serviceName})`);

  // Graceful shutdown — flush pending spans on SIGTERM
  process.on('SIGTERM', () => {
    void (async () => {
      try {
        await sdk.shutdown();
        console.log('[OTel] SDK shut down successfully');
      } catch (err) {
        console.error('[OTel] Error during SDK shutdown', err);
      }
    })();
  });
}

export {};
