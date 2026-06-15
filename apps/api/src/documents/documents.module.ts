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
import { STORAGE_PORT } from './storage/storage.port';
import { CloudinaryAdapter } from './storage/cloudinary.adapter';

@Module({
  imports: [PrismaModule],
  providers: [
    DocumentsService,
    {
      provide: STORAGE_PORT,
      useClass: CloudinaryAdapter,
    },
  ],
  controllers: [DocumentsController],
  exports: [DocumentsService, STORAGE_PORT],
})
export class DocumentsModule {}
