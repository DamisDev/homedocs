import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type {
  DocumentListQueryDto,
  TipoCategoria,
  Visibilita,
} from '@homedocs/shared-types';

export class ListDocumentsQueryDto implements DocumentListQueryDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsIn(['medico', 'casa', 'auto', 'altro'])
  tipo?: TipoCategoria;

  @IsOptional()
  @IsMongoId()
  vehicleId?: string;

  @IsOptional()
  @IsIn(['privato', 'condiviso'])
  visibilita?: Visibilita;

  @IsOptional()
  @IsDateString()
  scadenzaEntro?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
