/**
 * SGIP — App Configuration Schema
 *
 * Validates all required environment variables at startup.
 * Application fails fast with a clear error if any required secret is missing.
 * This prevents silent misconfigurations (Document 2, Section 11).
 */
import { z } from 'zod';

const configSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().url().describe('PostgreSQL connection URL'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),

  // JWT (RS256 — Document 3, Section 3)
  // Optional in dev/test — hardcoded test keys can be used locally
  JWT_PRIVATE_KEY: z
    .string()
    .optional()
    .describe('RS256 private key (PEM format)'),
  JWT_PUBLIC_KEY: z
    .string()
    .optional()
    .describe('RS256 public key (PEM format)'),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),

  // Cloudinary (Document 2, Section 9) — optional in dev
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // AI (Document 2, Section 7.1) — optional in dev (AI features are non-blocking)
  GROQ_API_KEY: z.string().optional(),

  // CORS
  CORS_ORIGINS: z
    .string()
    .optional()
    .describe('Comma-separated list of allowed origins'),

  // Rate Limiting
  THROTTLE_TTL_MS: z.coerce.number().default(60000),
  THROTTLE_LIMIT: z.coerce.number().default(100),

  // Email (for verification and notification)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // CSRF (Document 3, Section 4.3) — optional in dev
  CSRF_SECRET: z.string().min(32).optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

/**
 * Validates environment variables at startup.
 * Throws a descriptive error if any required variable is missing.
 * Never silently defaults security-relevant config (Document 2, Section 11 requirement).
 */
export function validateConfig(config: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(config);
  if (!result.success) {
    const missingVars = result.error.errors
      .map((err) => `  ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(
      `❌ Application configuration error. Fix the following environment variables:\n${missingVars}\n\nSee .env.example for the full list of required variables.`,
    );
  }
  return result.data;
}

export const appConfig = () => {
  const env = process.env;
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parseInt(env.PORT ?? '4000', 10),
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      host: env.REDIS_HOST ?? 'localhost',
      port: parseInt(env.REDIS_PORT ?? '6379', 10),
      password: env.REDIS_PASSWORD,
      tls: env.REDIS_TLS === 'true',
    },
    jwt: {
      privateKey: env.JWT_PRIVATE_KEY,
      publicKey: env.JWT_PUBLIC_KEY,
      accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY ?? '15m',
      refreshTokenExpiryDays: parseInt(
        env.JWT_REFRESH_TOKEN_EXPIRY_DAYS ?? '7',
        10,
      ),
    },
    cloudinary: {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    },
    ai: {
      groqApiKey: env.GROQ_API_KEY,
    },
    csrf: {
      secret: env.CSRF_SECRET,
    },
  };
};
