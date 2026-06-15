/**
 * SGIP — NestJS API Bootstrap
 * Tickets: SGIP-1.2.1.2 (GlobalPipe/Filter), SGIP-1.3.1.1 (pino logging)
 *
 * Sets up global guards, pipes, filters, and swagger documentation.
 * Security configuration follows Document 3 requirements.
 *
 * Logging: nestjs-pino is configured in AppModule via LoggerModule.forRoot().
 * The pino logger replaces the default NestJS logger and writes structured
 * JSON to stdout (in production) or pretty-printed output (in development).
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable default NestJS logger — nestjs-pino takes over after app init
    bufferLogs: true,
  });

  // ── Pino Logger (SGIP-1.3.1.1) ────────────────────────────────────────────
  // Must be set BEFORE any other app.use() or middleware to capture all logs.
  app.useLogger(app.get(Logger));

  // ── Cookie Parser (SGIP-2.1.2.3) ─────────────────────────────────────────
  // Required to read the httpOnly refresh token cookie on /auth/refresh
  app.use(cookieParser());

  // ── Security Headers (Document 3, Section 8.1) ───────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Needed for Cloudinary delivery
    }),
  );

  // ── CORS (Document 3, Section 8.1) ────────────────────────────────────────
  // Allow-listed origins only — no wildcard. Configured per environment.
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Required for httpOnly cookie-based refresh tokens
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'X-Correlation-ID', // Propagated by CorrelationInterceptor
      'X-CSRF-Token', // CSRF double-submit header (Document 3, Section 4.3)
      'Idempotency-Key', // For idempotent mutations (Document 2, Section 6.2)
    ],
    exposedHeaders: [
      'X-Correlation-ID', // Allow frontend to read the correlation ID for debugging
    ],
  });

  // ── Global API Prefix ─────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Global Validation Pipe (Document 3, Section 8.3 — mass assignment) ───
  // CRITICAL: whitelist=true strips unknown fields; forbidNonWhitelisted=true rejects them.
  // This is the primary defense against mass-assignment attacks.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, // Be explicit about type conversions
      },
    }),
  );

  // ── OpenAPI / Swagger ─────────────────────────────────────────────────────
  // Exposed in all non-production environments.
  // Frontend uses: pnpm --filter @sgip/web run api:generate-types
  // to pull /api/v1/openapi-json and generate src/lib/api/api.types.ts
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SGIP API')
      .setDescription(
        'Skill Gap Intelligence Platform — AI-assisted career intelligence system.\n\n' +
          'To generate typed frontend client:\n' +
          '`pnpm --filter @sgip/web run api:generate-types`',
      )
      .setVersion('0.1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addCookieAuth('sgip_refresh_token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/v1/openapi-json', // URL used by api:generate-types
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // ── Start Server ──────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  const pinoLogger = app.get(Logger);
  pinoLogger.log(
    {
      msg: 'SGIP API ready',
      port,
      env: process.env.NODE_ENV ?? 'development',
      swagger:
        process.env.NODE_ENV !== 'production'
          ? `http://localhost:${port}/api/docs`
          : 'disabled',
    },
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
