import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import type { CreateVehicleDto } from '@homedocs/shared-types';

export class CreateVehicleInputDto implements CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  targa: string;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsString()
  @IsNotEmpty()
  modello: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  anno: number;
}
