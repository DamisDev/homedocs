import type { EntityId, IsoDateString, StatoReminder, TipoNotifica } from './common';

/**
 * Promemoria di scadenza. Eredita la visibilità del documento collegato:
 * il backend non deve mai esporre reminder di documenti privati altrui.
 */
export interface ReminderDto {
  id: EntityId;
  documentId: EntityId;
  dataScadenza: IsoDateString;
  tipoNotifica: TipoNotifica;
  stato: StatoReminder;
  giorniAnticipoNotifica: number[];
}

export interface CreateReminderDto {
  documentId: EntityId;
  dataScadenza: IsoDateString;
  /** Default consigliato: [30, 15, 7]. */
  giorniAnticipoNotifica?: number[];
}

export interface UpdateReminderDto {
  dataScadenza?: IsoDateString;
  giorniAnticipoNotifica?: number[];
  stato?: StatoReminder;
}
