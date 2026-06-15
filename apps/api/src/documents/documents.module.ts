/**
 * SGIP — Documents Module
 *
 * Placeholder skeleton. Fully implemented in later phases.
 * The module file and its import in AppModule are pre-registered now
 * so the dependency graph (SGIP-1.2.1.1) is in place before feature code lands.
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [],
})
export class DocumentsModule {}
