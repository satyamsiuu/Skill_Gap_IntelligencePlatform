import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DocumentType } from '@sgip/shared';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType, example: 'RESUME' })
  @IsEnum(DocumentType)
  type: DocumentType;
}
