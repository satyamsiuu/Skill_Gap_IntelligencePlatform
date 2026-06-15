-- SGIP — PostgreSQL Initialization Script
-- Ticket: SGIP-1.3.2.2
--
-- This script runs ONCE on first container boot (docker-entrypoint-initdb.d).
-- It enables the required extensions for the SGIP database.
--
-- Extensions mirror the Prisma migration 20260615000001_extensions/migration.sql.
-- The pgvector/pgvector:pg16 Docker image includes the pgvector binary,
-- but the extension still must be enabled per-database.

-- Enable extensions in the sgip_dev database
\c sgip_dev;

CREATE EXTENSION IF NOT EXISTS vector;         -- pgvector: skill/role embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- trigram similarity: fuzzy skill name search
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- gen_random_uuid(): UUID generation fallback

-- Verify
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('vector', 'pg_trgm', 'pgcrypto');
