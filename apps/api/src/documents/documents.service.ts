import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { STORAGE_PORT, StoragePort } from './storage/storage.port';
import { DocumentType } from '@sgip/shared';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async uploadDocument(
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    providedMimeType: string,
    type: DocumentType,
  ) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException(
        'Student profile required to upload documents.',
      );
    }

    // Dynamic import because file-type is ESM
    const fileTypeImport = await import('file-type');
    const detected = await fileTypeImport.fileTypeFromBuffer(fileBuffer);
    const mimeType = detected?.mime || providedMimeType;

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `File type ${mimeType} is not supported. Use PDF, DOCX, PNG, or JPEG.`,
      );
    }

    if (fileBuffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('File exceeds 5MB limit.');
    }

    const storageKey = await this.storage.uploadFile(
      fileBuffer,
      originalFilename,
      mimeType,
      type.toLowerCase(),
    );

    const document = await this.prisma.document.create({
      data: {
        studentProfileId: profile.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        type: type as any,
        storageKey,
        originalFilename,
        mimeType,
        sizeBytes: fileBuffer.length,
        scanStatus: 'QUARANTINED',
      },
    });

    this.mockVirusScan(document.id);

    return document;
  }

  private mockVirusScan(documentId: string) {
    setTimeout(() => {
      void (async () => {
        try {
          await this.prisma.document.update({
            where: { id: documentId },
            data: { scanStatus: 'AVAILABLE', scannedAt: new Date() },
          });
          this.logger.log(`Document ${documentId} passed mock virus scan.`);
        } catch (err) {
          this.logger.error(
            `Failed to update mock scan status for ${documentId}`,
            err,
          );
        }
      })();
    }, 5000);
  }
}
