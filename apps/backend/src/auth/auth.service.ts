import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Types } from 'mongoose';
import type {
  AuthResponseDto,
  RuoloUtente,
  UserDto,
} from '@homedocs/shared-types';
import { HouseholdsService } from '../households/households.service';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';
import { JwtPayload } from './jwt-payload';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

/**
 * I refresh token sono JWT lunghi centinaia di byte: bcrypt tronca a 72 byte
 * e li renderebbe tutti equivalenti. Essendo già ad alta entropia, basta
 * SHA-256 con confronto in tempo costante.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function tokenMatchesHash(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly householdsService: HouseholdsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email già registrata');
    }

    const { householdId, ruolo } = await this.resolveHousehold(dto);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      nome: dto.nome,
      cognome: dto.cognome,
      householdId,
      ruolo,
    });

    return this.buildAuthResponse(user);
  }

  /**
   * Determina l'household del nuovo utente: o ne crea uno nuovo (admin) da
   * `nomeHousehold`, o entra in uno esistente (membro) da `codiceInvito`.
   * Va fornito esattamente uno dei due.
   */
  private async resolveHousehold(
    dto: RegisterDto,
  ): Promise<{ householdId: Types.ObjectId; ruolo: RuoloUtente }> {
    const nomeHousehold = dto.nomeHousehold?.trim();
    const codiceInvito = dto.codiceInvito?.trim();
    if (!!nomeHousehold === !!codiceInvito) {
      throw new BadRequestException(
        'Fornire esattamente uno tra "nomeHousehold" e "codiceInvito"',
      );
    }

    if (codiceInvito) {
      const household =
        await this.householdsService.findByInviteCode(codiceInvito);
      if (!household) {
        throw new BadRequestException('Codice invito non valido');
      }
      return { householdId: household._id, ruolo: 'membro' };
    }

    const household = await this.householdsService.create(nomeHousehold!);
    return { householdId: household._id, ruolo: 'admin' };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenziali non valide');
    }
    return this.buildAuthResponse(user);
  }

  /** Verifica il refresh token, lo confronta con l'hash salvato e ruota la coppia di token. */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token non valido o scaduto');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token non valido o scaduto');
    }

    const user = await this.usersService.findById(payload.sub);
    if (
      !user ||
      !user.refreshTokenHash ||
      !tokenMatchesHash(refreshToken, user.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Refresh token non valido o scaduto');
    }

    return this.buildAuthResponse(user);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.usersService.setRefreshTokenHash(user._id, null);
    }
  }

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.usersService.toDto(user);
  }

  private async buildAuthResponse(
    user: UserDocument,
  ): Promise<AuthResponseDto> {
    const basePayload = {
      sub: user._id.toHexString(),
      householdId: user.householdId.toHexString(),
    };

    const accessToken = await this.jwtService.signAsync(
      { ...basePayload, type: 'access' } satisfies JwtPayload,
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ??
          '15m') as JwtSignOptions['expiresIn'],
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { ...basePayload, type: 'refresh' } satisfies JwtPayload,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_TTL') ??
          '7d') as JwtSignOptions['expiresIn'],
      },
    );

    await this.usersService.setRefreshTokenHash(
      user._id,
      hashToken(refreshToken),
    );

    return {
      accessToken,
      refreshToken,
      user: this.usersService.toDto(user),
    };
  }
}
