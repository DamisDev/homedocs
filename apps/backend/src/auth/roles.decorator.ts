import { SetMetadata } from '@nestjs/common';
import type { RuoloUtente } from '@homedocs/shared-types';

export const ROLES_KEY = 'roles';

/** Vincola l'endpoint ai ruoli indicati; va usato insieme a `RolesGuard`. */
export const Roles = (...roles: RuoloUtente[]) => SetMetadata(ROLES_KEY, roles);
