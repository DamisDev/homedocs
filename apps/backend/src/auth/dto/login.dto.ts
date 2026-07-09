import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import type { LoginRequestDto } from '@homedocs/shared-types';

export class LoginDto implements LoginRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
