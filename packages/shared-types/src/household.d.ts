import type { EntityId, IsoDateString } from './common';
import type { UserDto } from './user';

export interface HouseholdDto {
  id: EntityId;
  nome: string;
  createdAt: IsoDateString;
}

/** Household con l'elenco dei membri (es. pagina gestione famiglia). */
export interface HouseholdWithMembersDto extends HouseholdDto {
  membri: UserDto[];
}
