import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RuoloUtente } from '@homedocs/shared-types';
import type { AuthenticatedUser } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

function buildContext(user: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  function buildGuard(requiredRoles: RuoloUtente[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    };
    return new RolesGuard(reflector as unknown as Reflector);
  }

  it("lascia passare chiunque se l'endpoint non ha @Roles(...)", () => {
    const guard = buildGuard(undefined);
    const context = buildContext({
      userId: 'u1',
      householdId: 'h1',
      ruolo: 'membro',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('lascia passare un utente col ruolo richiesto', () => {
    const guard = buildGuard(['admin']);
    const context = buildContext({
      userId: 'u1',
      householdId: 'h1',
      ruolo: 'admin',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("lancia ForbiddenException se il ruolo dell'utente non è tra quelli richiesti", () => {
    const guard = buildGuard(['admin']);
    const context = buildContext({
      userId: 'u1',
      householdId: 'h1',
      ruolo: 'membro',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
