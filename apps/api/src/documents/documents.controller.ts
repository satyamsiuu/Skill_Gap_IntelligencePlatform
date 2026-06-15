import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/documents.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnyRole } from '../common/decorators/roles.decorator';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Documents')
@Controller('documents')
@ApiBearerAuth('access-token')
@AnyRole()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document (Resume, Certificate, etc)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: RequestUser,
    @Body() dto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.documentsService.uploadDocument(
      user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
      dto.type,
    );
  }
}
