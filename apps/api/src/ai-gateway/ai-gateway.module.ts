/**
 * SGIP — AI Gateway Module (Document 2, Section 7.1)
 *
 * The SOLE entry point for ALL AI provider interactions.
 * No other module may import any AI provider SDK directly.
 * Enforced by dependency-cruiser rules (SGIP-1.2.1.3).
 *
 * Architecture: Port/Adapter pattern
 * - AIProviderPort: interface defining the provider contract
 * - GroqAdapter: implementation of AIProviderPort for Groq
 * - ProviderRouter: selects the active provider per feature from PlatformConfig
 * - CircuitBreaker: wraps provider calls with failure detection
 * - ResponseCache: Redis-backed cache for deterministic-ish AI outputs
 * - AIGatewayService: exposes feature-level methods to other modules
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [],
  exports: [],
})
export class AiGatewayModule {}
