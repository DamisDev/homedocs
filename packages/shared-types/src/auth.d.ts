import type { UserDto } from './user';

export interface RegisterRequestDto {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  /**
   * Registrazione con creazione di un nuovo household (utente `admin`).
   * Fornire esattamente uno tra `nomeHousehold` e `codiceInvito`.
   */
  nomeHousehold?: string;
  /**
   * Registrazione entrando in un household esistente (utente `membro`),
   * usando il codice invito condiviso dai membri attuali.
   */
  codiceInvito?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}
