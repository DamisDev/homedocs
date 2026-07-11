import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { UpdateVehicleDto } from '@homedocs/shared-types';

export class UpdateVehicleInputDto implements UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targa?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  marca?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  modello?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  anno?: number;
}
