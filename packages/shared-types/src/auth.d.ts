import type { UserDto } from './user';

export interface RegisterRequestDto {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  /**
   * Nome del nuovo household da creare alla registrazione.
   * In alternativa si entra in un household esistente tramite invito (post-MVP).
   */
  nomeHousehold: string;
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
