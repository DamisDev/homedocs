/**
 * Tipi base condivisi. Solo tipi (niente valori runtime) — vedi README.
 *
 * Sul filo (JSON) gli ObjectId Mongo e le date viaggiano come stringhe:
 * le date in formato ISO 8601.
 */

/** ObjectId Mongo serializzato come stringa esadecimale. */
export type EntityId = string;

/** Data serializzata in ISO 8601 (es. "2026-07-09T10:00:00.000Z"). */
export type IsoDateString = string;

export type Visibilita = 'privato' | 'condiviso';

export type StatoOcr = 'pending' | 'completato' | 'errore';

export type RuoloUtente = 'admin' | 'membro';

export type TipoCategoria = 'medico' | 'casa' | 'auto' | 'altro';

export type StatoReminder = 'attivo' | 'inviato' | 'scaduto';

export type TipoNotifica = 'email';
