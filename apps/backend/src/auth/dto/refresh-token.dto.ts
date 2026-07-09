import { IsJWT } from 'class-validator';
import type { RefreshTokenRequestDto } from '@homedocs/shared-types';

export class RefreshTokenDto implements RefreshTokenRequestDto {
  @IsJWT()
  refreshToken: string;
}
