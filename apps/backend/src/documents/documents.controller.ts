import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { DocumentDto, PaginatedDto } from '@homedocs/shared-types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { ChangeVisibilityInputDto } from './dto/change-visibility.dto';
import { CreateDocumentInputDto } from './dto/create-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents.dto';
import { UpdateDocumentInputDto } from './dto/update-document.dto';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/** Coerente col testo UI ("PDF o immagini"): rifiuta ogni altro content-type dichiarato. */
const ALLOWED_MIME_TYPES =
  /^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/;

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /** Upload multipart: campo "file" + campi del CreateDocumentDto. */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        callback(null, ALLOWED_MIME_TYPES.test(file.mimetype));
      },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<DocumentDto> {
    if (!file) {
      throw new BadRequestException('File mancante (campo multipart "file")');
    }
    return this.documentsService.create(user, dto, file);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<PaginatedDto<DocumentDto>> {
    return this.documentsService.list(user, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentDto> {
    return this.documentsService.findOne(user, id);
  }

  @Get(':id/file')
  getFileUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ url: string }> {
    return this.documentsService.getFileUrl(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentInputDto,
  ): Promise<DocumentDto> {
    return this.documentsService.update(user, id, dto);
  }

  @Patch(':id/visibility')
  changeVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeVisibilityInputDto,
  ): Promise<DocumentDto> {
    return this.documentsService.changeVisibility(user, id, dto.visibilita);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.documentsService.remove(user, id);
  }
}
