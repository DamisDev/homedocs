import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import type { RegisterRequestDto } from '@homedocs/shared-types';

export class RegisterDto implements RegisterRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  cognome: string;

  @IsString()
  @IsNotEmpty()
  nomeHousehold: string;
}
