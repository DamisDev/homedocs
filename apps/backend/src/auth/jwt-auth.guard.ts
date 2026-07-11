import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { RuoloUtente } from '@homedocs/shared-types';
import { JwtPayload } from './jwt-payload';

/** Utente autenticato disponibile su `request.user` dopo il guard. */
export interface AuthenticatedUser {
  userId: string;
  householdId: string;
  ruolo: RuoloUtente;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token mancante');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token non valido o scaduto');
    }
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token non valido o scaduto');
    }

    (request as Request & { user: AuthenticatedUser }).user = {
      userId: payload.sub,
      householdId: payload.householdId,
      ruolo: payload.ruolo,
    };
    return true;
  }
}
