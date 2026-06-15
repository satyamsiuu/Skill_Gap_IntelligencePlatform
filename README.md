# Skill Gap Intelligence Platform (SGIP)

> A production-grade AI-assisted career intelligence system that helps students identify skill gaps, receive personalized roadmaps, and track their readiness for target career roles.

## Core Design Principle

**Deterministic core, AI-enhanced edges.**

The readiness score is 100% deterministic — computed from student skills and role requirements, with zero AI dependency. AI features (resume parsing, score explanations, resource suggestions) enhance the experience but never block core functionality. The platform works fully when AI providers are unavailable.

## Architecture

**Monorepo** (pnpm workspaces)

```
├── apps/
│   ├── api/          # NestJS modular monolith (API + Worker)
│   └── web/          # Next.js App Router frontend
└── packages/
    └── shared/       # Shared TypeScript types and utilities
```

**Tech Stack**

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| State      | TanStack Query + Zustand                               |
| Backend    | NestJS + TypeScript (modular monolith)                 |
| ORM        | Prisma + PostgreSQL                                    |
| Extensions | pgvector + pg_trgm + pgcrypto                          |
| Queue      | BullMQ + Redis                                         |
| Storage    | Cloudinary                                             |
| AI         | Groq (via provider-agnostic AIGateway)                 |
| Embeddings | Local sentence-transformer (onnxruntime)               |
| Auth       | RS256 JWT + httpOnly refresh tokens                    |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (with pgvector support)
- Redis 7+

### Installation

```bash
# Install all workspace dependencies
pnpm install

# Copy environment variables
cp apps/api/.env.example apps/api/.env.local
# Fill in real values (DATABASE_URL, JWT keys, CLOUDINARY_*, GROQ_API_KEY, etc.)
```

### Database Setup

```bash
cd apps/api

# Run PostgreSQL extensions migration (must be first)
pnpm prisma:migrate

# Generate Prisma client
pnpm prisma:generate

# Seed initial taxonomy data
pnpm prisma:seed
```

### Development

```bash
# Start both apps in parallel (from repo root)
pnpm dev

# Or individually:
pnpm --filter @sgip/api run dev       # NestJS API on :4000
pnpm --filter @sgip/web run dev       # Next.js on :3000
pnpm --filter @sgip/api run start:worker  # BullMQ worker
```

### Testing

```bash
pnpm test          # All unit tests
pnpm test:e2e      # End-to-end tests (requires running DB)
pnpm typecheck     # TypeScript checks across all packages
pnpm lint          # ESLint across all packages
```

## Documentation

| Document                                                         | Description                      |
| ---------------------------------------------------------------- | -------------------------------- |
| [01-PRD.md](./01-PRD.md)                                         | Product Requirements Document    |
| [02-Technical-Architecture.md](./02-Technical-Architecture.md)   | Architecture + data models       |
| [03-Security-Access-Control.md](./03-Security-Access-Control.md) | Security specification           |
| [04-Frontend-Specification.md](./04-Frontend-Specification.md)   | Design tokens + components       |
| [05-Feature-Ticket-List.md](./05-Feature-Ticket-List.md)         | Development backlog              |
| [IMPLEMENTATION_STRATEGY.md](./IMPLEMENTATION_STRATEGY.md)       | Build plan + dependency graph    |
| [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)         | ADRs (20 founding decisions)     |
| [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)                     | Current status tracker           |
| [IMPLEMENTATION_LOG.md](./IMPLEMENTATION_LOG.md)                 | Per-ticket implementation record |
| [SESSION_HANDOFF.md](./SESSION_HANDOFF.md)                       | Session-to-session context       |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)                             | Tracked issues and debt          |

## Non-Negotiable Architectural Laws

1. **AI Independence Law**: Scoring Engine module MUST NOT import AI Gateway
2. **Deterministic Scoring Law**: Score formula is pure function — no AI in path, <200ms
3. **Module Boundary Law**: Port/adapter pattern; dependency-cruiser enforces boundaries in CI
4. **Human-in-the-Loop Law**: AI-suggested skills = `PENDING_REVIEW` always; never auto-confirmed
5. **Versioned Requirements Law**: RoleRequirementSet is append-only; never mutate existing versions
6. **Auth Law**: Every route requires `@Roles()` or `@Public()`; routes with neither fail CI
7. **AI Gateway Singleton Law**: Only ai-gateway module imports any LLM provider SDK

See [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) for the full ADR list.
