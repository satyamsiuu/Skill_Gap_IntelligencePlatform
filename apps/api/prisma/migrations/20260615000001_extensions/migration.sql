-- SGIP — PostgreSQL Extensions Migration
-- Ticket: SGIP-1.1.2.1
--
-- WHY RAW SQL: Prisma's schema language does not support the `CREATE EXTENSION`
-- statement. This migration runs raw SQL directly via `prisma db execute`.
-- This approach is documented in Document 2, Section 12 and in ADR-011.
--
-- These extensions must be enabled BEFORE any other migrations run, as
-- subsequent migrations rely on pgvector column types and pg_trgm operators.
--
-- Supported PostgreSQL providers:
-- - Neon (pgvector supported)
-- - Supabase (pgvector supported)
-- - AWS RDS (pgvector supported since PostgreSQL 15.x with the extension module)
-- - Cloud SQL for PostgreSQL (pgvector supported via extensions)
--
-- Verify after running: SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'pgcrypto');

-- pgvector: Enables `vector` data type and cosine similarity operators (<=>)
-- Used for skill and role embedding storage and similarity search (SGIP-4.1.2.1, SGIP-4.1.2.2)
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm: Enables trigram-based text similarity (GIN indexes, similarity() function)
-- Used for typo-tolerant skill/role search (SGIP-4.1.1.2, SGIP-5.1.1.2, SGIP-6.1.1.1)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pgcrypto: Enables cryptographic functions (gen_random_bytes for CSPRNG token generation)
-- Used for refresh token generation (Document 3, Section 4.1)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
