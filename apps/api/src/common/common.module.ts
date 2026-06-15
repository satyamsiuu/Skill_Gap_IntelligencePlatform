/**
 * SGIP — Common Module
 *
 * Houses shared infrastructure (guards, filters, interceptors, decorators)
 * used across all feature modules.
 *
 * Note: PrismaModule is a separate module to keep the DB concerns isolated.
 * This module focuses on HTTP-layer cross-cutting concerns.
 */
import { Module } from '@nestjs/common';

@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}
