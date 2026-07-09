import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { UpdateDocumentDto } from '@homedocs/shared-types';
import { PagamentoInputDto } from './create-document.dto';

export class UpdateDocumentInputDto implements UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoria?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titolo?: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsDateString()
  dataDocumento?: string;

  @IsOptional()
  @IsDateString()
  dataScadenza?: string | null;

  @IsOptional()
  @IsObject()
  datiEstratti?: Record<string, unknown>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PagamentoInputDto)
  pagamento?: PagamentoInputDto | null;
}
