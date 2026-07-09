import type { EntityId, IsoDateString, RuoloUtente } from './common';

/** Utente come esposto dalle API — mai includere passwordHash. */
export interface UserDto {
  id: EntityId;
  email: string;
  nome: string;
  cognome: string;
  householdId: EntityId;
  ruolo: RuoloUtente;
  createdAt: IsoDateString;
}
