/**
 * SGIP — Prisma Database Module
 *
 * Provides a global PrismaService (extends PrismaClient) that handles connection
 * lifecycle, including graceful shutdown on app close.
 *
 * All modules that need database access inject PrismaService.
 * Never import PrismaClient directly in feature modules.
 */
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
