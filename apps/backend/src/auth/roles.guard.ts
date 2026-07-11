import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { RuoloUtente } from '@homedocs/shared-types';
import type { AuthenticatedUser } from './jwt-auth.guard';
import { ROLES_KEY } from './roles.decorator';

/**
 * Autorizzazione per ruolo: va applicato DOPO JwtAuthGuard (richiede
 * `request.user` già popolato). Se l'endpoint non ha `@Roles(...)`, lascia
 * passare chiunque sia autenticato.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      RuoloUtente[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    if (!requiredRoles.includes(user.ruolo)) {
      throw new ForbiddenException(
        'Non hai i permessi per compiere questa azione',
      );
    }
    return true;
  }
}
