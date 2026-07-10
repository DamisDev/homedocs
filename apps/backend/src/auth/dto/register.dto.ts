import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { RegisterRequestDto } from '@homedocs/shared-types';

/**
 * Registrazione: fornire esattamente uno tra `nomeHousehold` (crea un nuovo
 * household, ruolo admin) e `codiceInvito` (entra in uno esistente, ruolo
 * membro). Il vincolo "esattamente uno" è verificato in `AuthService`.
 */
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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomeHousehold?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codiceInvito?: string;
}
