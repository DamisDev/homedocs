import { Type } from 'class-transformer';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { CreateDocumentDto, PagamentoDto } from '@homedocs/shared-types';

export class PagamentoInputDto implements PagamentoDto {
  @IsNumber()
  @Type(() => Number)
  importo: number;

  @IsString()
  @IsNotEmpty()
  valuta: string;

  @IsString()
  @IsNotEmpty()
  metodoPagamento: string;

  @IsDateString()
  dataPagamento: string;

  @IsOptional()
  @IsString()
  ricevutaUrl?: string;
}

/**
 * Nota privacy: `visibilita` non è accettata qui — il documento nasce
 * sempre privato e va condiviso esplicitamente dal proprietario.
 */
export class CreateDocumentInputDto implements CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsString()
  @IsNotEmpty()
  titolo: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsDateString()
  dataDocumento: string;

  @IsOptional()
  @IsDateString()
  dataScadenza?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PagamentoInputDto)
  pagamento?: PagamentoInputDto;

  @IsOptional()
  @IsMongoId()
  vehicleId?: string;
}
